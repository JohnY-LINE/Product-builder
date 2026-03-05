(() => {
  const STORE_KEYS = {
    selections: "cms.userSelections.v1",
    quantities: "cms.detailQty.v1",
    submissions: "cms.submissions.v1",
    templateEditor: "cms.templateEditor.v1",
    adminFilters: "cms.adminFilters.v1",
    adminAccordions: "cms.adminAccordions.v1",
    adminTheme: "cms.adminTheme.v1",
    uiTheme: "cms.uiTheme.v1",
    buttonTheme: "cms.buttonTheme.v1",
    fontTheme: "cms.fontTheme.v1",
    adminCategoryOrder: "cms.adminCategoryOrder.v1",
    deletedCategories: "cms.deletedCategories.v1",
    allProductsDeleted: "cms.allProductsDeleted.v1",
    categorySubtypes: "cms.categorySubtypes.v1",
    productMeta: "cms.productMeta.v1",
    productFilters: "cms.productFilters.v1"
  };
  const EDITOR_STORE_KEYS = {
    products: "lf.products.v1",
    templates: "lf.templates.v1",
    productCategories: "lf.product.categories.v1"
  };

  const DEFAULT_OPTIONS = {
    size: [{ value: "S", delta: 0 }, { value: "M", delta: 1000 }, { value: "L", delta: 2000 }],
    color: [{ value: "Melange", delta: 0 }, { value: "Black", delta: 500 }, { value: "Navy", delta: 500 }],
    material: [{ value: "Standard", delta: 0 }, { value: "Premium", delta: 3000 }]
  };
  const STORE_CATEGORIES = ["슬로건", "우치와", "키링", "소품", "머그컵", "티셔츠", "특가상품"];
  const STORE_CATEGORY_SET = new Set(STORE_CATEGORIES);
  const CATEGORY_SLUG_BY_NAME = {
    슬로건: "slogan",
    우치와: "uchiwa",
    키링: "keyring",
    소품: "small-goods",
    머그컵: "mugcup",
    티셔츠: "tshirt",
    특가상품: "special-deals"
  };
  const CATEGORY_NAME_BY_SLUG = Object.fromEntries(
    Object.entries(CATEGORY_SLUG_BY_NAME).map(([name, slug]) => [slug, name])
  );
  const CATEGORY_SAMPLE_TYPES = {
    슬로건: ["레터링 슬로건", "캘리그라피 슬로건", "행사용 슬로건"],
    우치와: ["팬 응원 우치와", "캐릭터 우치와", "행사 홍보 우치와"],
    키링: ["아크릴 키링", "PVC 키링", "메탈 키링"],
    소품: ["파우치", "스티커팩", "엽서 세트"],
    머그컵: ["화이트 머그컵", "컬러 머그컵", "포토 머그컵"],
    티셔츠: ["기본 반팔", "오버핏 반팔", "롱슬리브"],
    특가상품: ["한정 특가", "재고 정리", "시즌 프로모션"]
  };

  const SEED_PRODUCTS = [
    {
      id: "default_product",
      name: "스페셜 인터록 오버핏 맨투맨",
      canvasMode: "fit",
      category: "티셔츠",
      basePrice: 15900,
      tags: ["베스트", "오버핏"],
      mockups: ["Front", "Back", "Detail"],
      description: "탄탄한 인터록 원단, 대량 제작 대응",
      options: {
        size: [{ value: "S", delta: 0 }, { value: "M", delta: 1000 }, { value: "L", delta: 2000 }],
        color: [{ value: "Melange", delta: 0 }, { value: "Black", delta: 500 }, { value: "Navy", delta: 500 }],
        material: [{ value: "Standard", delta: 0 }, { value: "Premium", delta: 3000 }]
      }
    },
    {
      id: "hood_zipup",
      name: "오버핏 후드집업",
      canvasMode: "fit",
      category: "슬로건",
      basePrice: 24900,
      tags: ["신상", "양면인쇄"],
      mockups: ["Front", "Back", "Detail"],
      description: "앞/뒤 개별 커스터마이징 가능",
      options: {
        size: [{ value: "M", delta: 0 }, { value: "L", delta: 1500 }, { value: "XL", delta: 2500 }],
        color: [{ value: "Black", delta: 0 }, { value: "Gray", delta: 0 }, { value: "Cream", delta: 700 }],
        material: [{ value: "Cotton", delta: 0 }, { value: "Heavy", delta: 3200 }]
      }
    },
    {
      id: "eco_tote",
      name: "에코 토트백",
      canvasMode: "fit",
      category: "소품",
      basePrice: 8900,
      tags: ["저가", "입문용"],
      mockups: ["Front", "Back", "Side"],
      description: "가벼운 커스텀 굿즈 제작에 적합",
      options: {
        size: [{ value: "Small", delta: 0 }, { value: "Medium", delta: 900 }, { value: "Large", delta: 1800 }],
        color: [{ value: "Ivory", delta: 0 }, { value: "Black", delta: 300 }],
        material: [{ value: "10수", delta: 0 }, { value: "16수", delta: 1200 }]
      }
    }
  ];
  const SEED_BY_ID = Object.fromEntries(SEED_PRODUCTS.map((p) => [p.id, p]));
  const PRODUCT_META_DEFAULT = Object.fromEntries(SEED_PRODUCTS.map((p) => [p.id, {
    category: p.category,
    basePrice: p.basePrice,
    tags: p.tags,
    mockups: p.mockups,
    description: p.description,
    options: p.options,
    isPublished: true
  }]));

  function normalizeOptionEntries(list) {
    if (!Array.isArray(list)) return [];
    const out = list
      .map((x) => ({
        value: String(x?.value || "").trim(),
        delta: Number(x?.delta || 0)
      }))
      .filter((x) => x.value);
    return out.length ? out : [];
  }

  function normalizeOptions(raw, fallback) {
    const base = fallback || DEFAULT_OPTIONS;
    const source = raw && typeof raw === "object" ? raw : {};
    return {
      size: normalizeOptionEntries(source.size).length ? normalizeOptionEntries(source.size) : base.size,
      color: normalizeOptionEntries(source.color).length ? normalizeOptionEntries(source.color) : base.color,
      material: normalizeOptionEntries(source.material).length ? normalizeOptionEntries(source.material) : base.material
    };
  }

  function normalizeMeta(raw, seed) {
    const src = raw && typeof raw === "object" ? raw : {};
    const fallback = seed || {};
    const tags = (Array.isArray(src.tags) ? src.tags : (Array.isArray(fallback.tags) ? fallback.tags : []))
      .map((x) => String(x || "").trim())
      .filter(Boolean);
    const mockups = (Array.isArray(src.mockups) ? src.mockups : (Array.isArray(fallback.mockups) ? fallback.mockups : []))
      .map((x) => String(x || "").trim())
      .filter(Boolean);
    return {
      category: normalizeStoreCategory(src.category || fallback.category || STORE_CATEGORIES[0]),
      subcategory: String(src.subcategory || fallback.subcategory || "").trim(),
      basePrice: Math.max(0, Number(src.basePrice ?? fallback.basePrice ?? 0)),
      tags,
      mockups,
      description: String(src.description || fallback.description || "").trim(),
      detailContent: String(src.detailContent || fallback.detailContent || "").trim(),
      options: normalizeOptions(src.options, fallback.options || DEFAULT_OPTIONS),
      isPublished: src.isPublished !== false
    };
  }

  function loadEditorProducts() {
    const local = loadJson(EDITOR_STORE_KEYS.products, []);
    if (Array.isArray(local) && local.length) {
      return local
        .filter((p) => p && p.id && p.name)
        .map((p) => ({
          id: String(p.id),
          name: String(p.name),
          canvasMode: p.canvasMode === "compact" || p.canvasMode === "focus" ? p.canvasMode : "fit",
          category: String(p.category || ""),
          basePrice: Number(p.basePrice || 0),
          isPublished: p.isPublished !== false
        }));
    }
    if (state.allProductsDeleted) {
      localStorage.setItem(EDITOR_STORE_KEYS.products, JSON.stringify([]));
      return [];
    }
    const seeded = SEED_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      canvasMode: p.canvasMode || "fit",
      category: p.category,
      basePrice: p.basePrice,
      isPublished: true
    }));
    localStorage.setItem(EDITOR_STORE_KEYS.products, JSON.stringify(seeded));
    return seeded;
  }

  function saveEditorProducts(items) {
    localStorage.setItem(EDITOR_STORE_KEYS.products, JSON.stringify(items));
  }

  function loadEditorTemplates() {
    const local = loadJson(EDITOR_STORE_KEYS.templates, []);
    if (!Array.isArray(local)) return [];
    return local.filter((tpl) => tpl && tpl.id).map((tpl) => ({
      ...tpl,
      id: String(tpl.id),
      name: String(tpl.name || tpl.id),
      productId: String(tpl.productId || "default_product"),
      pageName: String(tpl.pageName || "페이지")
    }));
  }

  function saveEditorTemplates(items) {
    localStorage.setItem(EDITOR_STORE_KEYS.templates, JSON.stringify(items));
  }

  function collectTemplateViewsForProduct(productId) {
    const names = [];
    loadEditorTemplates().forEach((tpl) => {
      if (tpl.productId === productId) {
        const n = String(tpl.pageName || "").trim();
        if (n) names.push(n);
      }
    });
    return [...new Set(names)];
  }

  function getCatalogProducts() {
    const editorProducts = loadEditorProducts();
    const nextMeta = { ...state.productMeta };
    const catalog = editorProducts.map((p) => {
      const seed = PRODUCT_META_DEFAULT[p.id] || SEED_BY_ID[p.id] || {};
      const meta = normalizeMeta(nextMeta[p.id], seed);
      meta.category = normalizeStoreCategory(p.category || meta.category || seed.category || STORE_CATEGORIES[0]);
      if (!meta.basePrice && Number.isFinite(p.basePrice)) meta.basePrice = Math.max(0, Number(p.basePrice));
      if (p.isPublished === false) meta.isPublished = false;
      const templateViews = collectTemplateViewsForProduct(p.id);
      if (!meta.mockups.length && templateViews.length) meta.mockups = templateViews;
      if (!meta.mockups.length) meta.mockups = (seed.mockups && seed.mockups.length) ? seed.mockups : ["Front"];
      nextMeta[p.id] = meta;
      return {
        id: p.id,
        name: p.name,
        canvasMode: p.canvasMode,
        category: meta.category,
        subcategory: String(meta.subcategory || "").trim(),
        basePrice: meta.basePrice,
        tags: meta.tags,
        mockups: meta.mockups,
        description: meta.description,
        detailContent: String(meta.detailContent || "").trim(),
        options: meta.options,
        isPublished: meta.isPublished
      };
    });
    const existing = new Set(editorProducts.map((p) => p.id));
    Object.keys(nextMeta).forEach((pid) => {
      if (!existing.has(pid)) delete nextMeta[pid];
    });
    state.productMeta = nextMeta;
    saveJson(STORE_KEYS.productMeta, state.productMeta);
    return catalog;
  }

  const runtimeAssetStore = (window.__submissionAssetStore = window.__submissionAssetStore || new Map());

  const state = {
    currentRoute: "/",
    currentParams: {},
    currentDetailProductId: SEED_PRODUCTS[0].id,
    selections: loadJson(STORE_KEYS.selections, {}),
    quantities: loadJson(STORE_KEYS.quantities, {}),
    submissions: loadJson(STORE_KEYS.submissions, []),
    templateEditor: loadJson(STORE_KEYS.templateEditor, {}),
    adminFilters: loadJson(STORE_KEYS.adminFilters, {}),
    adminAccordions: loadJson(STORE_KEYS.adminAccordions, {}),
    productMeta: loadJson(STORE_KEYS.productMeta, PRODUCT_META_DEFAULT),
    productFilters: loadJson(STORE_KEYS.productFilters, { category: "all" }),
    adminTheme: String(loadJson(STORE_KEYS.adminTheme, "clean-blue") || "clean-blue"),
    uiTheme: String(loadJson(STORE_KEYS.uiTheme, "light-mist") || "light-mist"),
    buttonTheme: String(loadJson(STORE_KEYS.buttonTheme, "sunset") || "sunset"),
    fontTheme: String(loadJson(STORE_KEYS.fontTheme, "classic") || "classic"),
    adminCategoryOrder: Array.isArray(loadJson(STORE_KEYS.adminCategoryOrder, [])) ? loadJson(STORE_KEYS.adminCategoryOrder, []) : [],
    deletedCategories: Array.isArray(loadJson(STORE_KEYS.deletedCategories, [])) ? loadJson(STORE_KEYS.deletedCategories, []) : [],
    allProductsDeleted: loadJson(STORE_KEYS.allProductsDeleted, false) === true,
    categorySubtypes: loadJson(STORE_KEYS.categorySubtypes, {})
  };

  const PAGE_MAP = {
    "/": "page-home",
    "/products": "page-products",
    "/products/:id": "page-product-detail",
    "/editor/:productId": "page-editor",
    "/my-submissions": "page-my-submissions",
    "/admin/login": "page-admin-login",
    "/admin/products": "page-admin-products",
    "/admin/products/new": "page-admin-product-form",
    "/admin/products/:id/edit": "page-admin-product-form",
    "/admin/templates": "page-admin-templates",
    "/admin/options": "page-admin-options",
    "/admin/inbox": "page-admin-inbox",
    "/admin/inbox/:submissionId": "page-admin-submission-detail"
  };

  const pages = Array.from(document.querySelectorAll(".routePage"));
  const routeLinks = Array.from(document.querySelectorAll("[data-route]"));
  const topCategoryNav = document.querySelector(".commerceNav");
  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function applyAdminThemeUi() {
    const body = document.body;
    if (!body) return;
    const next = state.adminTheme === "warm-neutral" ? "warm-neutral" : "clean-blue";
    state.adminTheme = next;
    body.setAttribute("data-admin-ui-theme", next);
    const select = document.getElementById("adminThemeSelect");
    if (select) select.value = next;
  }

  function applyUiTheme() {
    const body = document.body;
    if (!body) return;
    const allowed = new Set(["light-mist", "dark-slate", "forest-mint", "ruby-night"]);
    const next = allowed.has(state.uiTheme) ? state.uiTheme : "light-mist";
    state.uiTheme = next;
    body.setAttribute("data-ui-theme", next);
    const select = document.getElementById("adminColorThemeSelect");
    if (select) select.value = next;
  }

  function applyButtonTheme() {
    const body = document.body;
    if (!body) return;
    const allowed = new Set(["sunset", "ocean", "mono"]);
    const next = allowed.has(state.buttonTheme) ? state.buttonTheme : "sunset";
    state.buttonTheme = next;
    body.setAttribute("data-button-theme", next);
    const select = document.getElementById("adminButtonThemeSelect");
    if (select) select.value = next;
  }

  function applyFontTheme() {
    const body = document.body;
    if (!body) return;
    const allowed = new Set(["classic", "cool-gray", "warm-ink", "high-contrast"]);
    const next = allowed.has(state.fontTheme) ? state.fontTheme : "classic";
    state.fontTheme = next;
    body.setAttribute("data-font-theme", next);
    const select = document.getElementById("adminFontThemeSelect");
    if (select) select.value = next;
  }

  function initAdminThemeSwitch() {
    const wrap = document.getElementById("adminThemeSwitch");
    const adminSelect = document.getElementById("adminThemeSelect");
    const colorSelect = document.getElementById("adminColorThemeSelect");
    const buttonSelect = document.getElementById("adminButtonThemeSelect");
    const fontSelect = document.getElementById("adminFontThemeSelect");
    if (!wrap || !adminSelect || !colorSelect || !buttonSelect || !fontSelect || adminSelect.dataset.bound === "1") {
      applyAdminThemeUi();
      applyUiTheme();
      applyButtonTheme();
      applyFontTheme();
      return;
    }
    adminSelect.value = state.adminTheme === "warm-neutral" ? "warm-neutral" : "clean-blue";
    colorSelect.value = ["light-mist", "dark-slate", "forest-mint", "ruby-night"].includes(state.uiTheme)
      ? state.uiTheme
      : "light-mist";
    buttonSelect.value = ["sunset", "ocean", "mono"].includes(state.buttonTheme) ? state.buttonTheme : "sunset";
    fontSelect.value = ["classic", "cool-gray", "warm-ink", "high-contrast"].includes(state.fontTheme) ? state.fontTheme : "classic";
    adminSelect.addEventListener("change", () => {
      const next = adminSelect.value === "warm-neutral" ? "warm-neutral" : "clean-blue";
      state.adminTheme = next;
      saveJson(STORE_KEYS.adminTheme, next);
      applyAdminThemeUi();
    });
    colorSelect.addEventListener("change", () => {
      const next = ["light-mist", "dark-slate", "forest-mint", "ruby-night"].includes(colorSelect.value)
        ? colorSelect.value
        : "light-mist";
      state.uiTheme = next;
      saveJson(STORE_KEYS.uiTheme, next);
      applyUiTheme();
    });
    buttonSelect.addEventListener("change", () => {
      const next = ["sunset", "ocean", "mono"].includes(buttonSelect.value) ? buttonSelect.value : "sunset";
      state.buttonTheme = next;
      saveJson(STORE_KEYS.buttonTheme, next);
      applyButtonTheme();
    });
    fontSelect.addEventListener("change", () => {
      const next = ["classic", "cool-gray", "warm-ink", "high-contrast"].includes(fontSelect.value) ? fontSelect.value : "classic";
      state.fontTheme = next;
      saveJson(STORE_KEYS.fontTheme, next);
      applyFontTheme();
    });
    adminSelect.dataset.bound = "1";
    applyAdminThemeUi();
    applyUiTheme();
    applyButtonTheme();
    applyFontTheme();
  }

  function normalizeStoreCategory(value) {
    const v = String(value || "").trim();
    return v || STORE_CATEGORIES[0];
  }

  function getAllStoreCategories() {
    if (state.allProductsDeleted) return [];
    const custom = loadJson(EDITOR_STORE_KEYS.productCategories, []);
    const fromCustom = [...new Set((Array.isArray(custom) ? custom : [])
      .map((x) => String(x || "").trim())
      .filter(Boolean))];
    const fromCatalog = [...new Set(getCatalogProducts()
      .map((p) => String(p.category || "").trim())
      .filter(Boolean))];
    const deleted = new Set(
      (Array.isArray(state.deletedCategories) ? state.deletedCategories : [])
        .map((x) => String(x || "").trim())
        .filter(Boolean)
    );
    const filteredCustom = fromCustom.filter((x) => !deleted.has(x));
    if (filteredCustom.length) return filteredCustom;
    const filteredCatalog = fromCatalog.filter((x) => !deleted.has(x));
    if (filteredCatalog.length) return filteredCatalog;
    const fallback = STORE_CATEGORIES.find((x) => !deleted.has(x)) || STORE_CATEGORIES[0];
    return [fallback];
  }

  function normalizeSubtypeList(input) {
    return [...new Set((Array.isArray(input) ? input : [])
      .map((x) => String(x || "").trim())
      .filter(Boolean))]
      .slice(0, 10);
  }

  function getCategorySampleTypes(categoryName) {
    const key = normalizeStoreCategory(categoryName);
    const customRaw = state.categorySubtypes && typeof state.categorySubtypes === "object"
      ? state.categorySubtypes[key]
      : null;
    const custom = normalizeSubtypeList(Array.isArray(customRaw) ? customRaw : []);
    if (custom.length) return custom.slice(0, 3);
    const fallback = CATEGORY_SAMPLE_TYPES[key] || ["기본 타입 A", "기본 타입 B", "기본 타입 C"];
    return fallback.slice(0, 3);
  }

  function getOrderedStoreCategories() {
    const categories = getAllStoreCategories();
    const order = Array.isArray(state.adminCategoryOrder) ? state.adminCategoryOrder : [];
    const set = new Set(categories);
    const pinned = order.filter((x) => set.has(x));
    const rest = categories.filter((x) => !pinned.includes(x));
    return pinned.concat(rest);
  }

  function saveAdminCategoryOrder(next) {
    state.adminCategoryOrder = Array.isArray(next) ? next.slice() : [];
    saveJson(STORE_KEYS.adminCategoryOrder, state.adminCategoryOrder);
  }

  function saveDeletedCategories(next) {
    state.deletedCategories = Array.isArray(next)
      ? [...new Set(next.map((x) => String(x || "").trim()).filter(Boolean))]
      : [];
    saveJson(STORE_KEYS.deletedCategories, state.deletedCategories);
  }

  function loadCustomStoreCategories() {
    const raw = loadJson(EDITOR_STORE_KEYS.productCategories, []);
    return Array.isArray(raw)
      ? [...new Set(raw.map((x) => String(x || "").trim()).filter(Boolean))]
      : [];
  }

  function saveCustomStoreCategories(next) {
    localStorage.setItem(EDITOR_STORE_KEYS.productCategories, JSON.stringify(
      Array.isArray(next) ? [...new Set(next.map((x) => String(x || "").trim()).filter(Boolean))] : []
    ));
  }

  function buildCategorySlugMaps() {
    const slugByName = {};
    const nameBySlug = {};
    const categories = getOrderedStoreCategories();
    categories.forEach((name) => {
      let base = CATEGORY_SLUG_BY_NAME[name];
      if (!base) {
        base = name
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]+/g, "-")
          .replace(/^-+|-+$/g, "");
      }
      if (!base) base = "category";
      let slug = base;
      let seq = 2;
      while (nameBySlug[slug] && nameBySlug[slug] !== name) {
        slug = `${base}-${seq}`;
        seq += 1;
      }
      slugByName[name] = slug;
      nameBySlug[slug] = name;
    });
    return { slugByName, nameBySlug };
  }

  function normalizeCategoryFilter(value) {
    const v = String(value || "").trim();
    if (v === "all") return "all";
    const set = new Set(getOrderedStoreCategories());
    return set.has(v) ? v : "all";
  }

  function categoryToSlug(name) {
    const normalized = normalizeStoreCategory(name);
    const { slugByName } = buildCategorySlugMaps();
    return slugByName[normalized] || slugByName[STORE_CATEGORIES[0]] || "slogan";
  }

  function slugToCategory(slug) {
    const key = String(slug || "").trim().toLowerCase();
    const { nameBySlug } = buildCategorySlugMaps();
    return nameBySlug[key] || STORE_CATEGORIES[0];
  }

  function setProductCategoryFilter(value) {
    state.productFilters.category = normalizeCategoryFilter(value);
    saveJson(STORE_KEYS.productFilters, state.productFilters);
  }

  function syncTopCategoryNav() {
    const topCategoryLinks = Array.from(document.querySelectorAll("[data-top-category]"));
    const canHighlight = state.currentRoute === "/products" || state.currentRoute === "/products/category/:categorySlug";
    const activeCategory = canHighlight ? normalizeCategoryFilter(state.productFilters.category) : "";
    topCategoryLinks.forEach((a) => {
      const name = String(a.dataset.topCategory || "").trim();
      a.classList.toggle("active", activeCategory !== "all" && name === activeCategory);
    });
  }

  function applyCategoryAndRoute(categoryName) {
    const normalized = normalizeStoreCategory(categoryName);
    setProductCategoryFilter(normalized);
    syncTopCategoryNav();
    const targetHash = `#/products/category/${categoryToSlug(normalized)}`;
    if (location.hash === targetHash) {
      renderProductsCategoryPage(normalized);
      return;
    }
    location.hash = targetHash;
  }

  function initTopCategoryNav() {
    if (!topCategoryNav) return;
    const categories = getOrderedStoreCategories();
    topCategoryNav.innerHTML = categories.map((name) => {
      const normalized = normalizeStoreCategory(name);
      const slug = categoryToSlug(normalized);
      const isDeal = normalized === "특가상품";
      return `<a href="#/products/category/${slug}" class="navItem${isDeal ? " navItemDeal" : ""}" data-top-category="${esc(normalized)}">${esc(normalized)}${isDeal ? ' <span aria-hidden="true">🔔</span>' : ""}</a>`;
    }).join("");
    const topCategoryLinks = Array.from(topCategoryNav.querySelectorAll("[data-top-category]"));
    topCategoryLinks.forEach((a) => {
      const normalized = normalizeStoreCategory(a.dataset.topCategory || "");
      a.setAttribute("href", `#/products/category/${categoryToSlug(normalized)}`);
      a.addEventListener("click", (e) => {
        e.preventDefault();
        applyCategoryAndRoute(a.dataset.topCategory || "");
      });
    });
  }

  function won(v) {
    return new Intl.NumberFormat("ko-KR").format(v) + "원";
  }

  function esc(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeDecodeUriSegment(segment) {
    try {
      return decodeURIComponent(String(segment || ""));
    } catch {
      return String(segment || "");
    }
  }

  function sanitizeImageUrl(raw) {
    const value = String(raw || "").trim();
    if (!value) return "";
    return /^(https?:|blob:|data:image\/|\/|\.{1,2}\/)/i.test(value) ? value : "";
  }

  function sanitizeDetailHtml(rawHtml) {
    const template = document.createElement("template");
    template.innerHTML = String(rawHtml || "");
    const allowedTags = new Set(["H2", "H3", "H4", "P", "UL", "OL", "LI", "STRONG", "EM", "B", "I", "U", "BR", "A", "IMG", "BLOCKQUOTE", "HR", "SPAN"]);
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const tag = child.tagName.toUpperCase();
          if (!allowedTags.has(tag)) {
            const fragment = document.createDocumentFragment();
            while (child.firstChild) fragment.appendChild(child.firstChild);
            child.replaceWith(fragment);
            walk(node);
            return;
          }
          Array.from(child.attributes).forEach((attr) => {
            const name = attr.name.toLowerCase();
            const value = String(attr.value || "").trim();
            if (name.startsWith("on")) {
              child.removeAttribute(attr.name);
              return;
            }
            if (tag === "A") {
              const allowed = new Set(["href", "target", "rel"]);
              if (!allowed.has(name)) child.removeAttribute(attr.name);
              if (name === "href" && /^(javascript:|data:)/i.test(value)) child.removeAttribute(attr.name);
              if (name === "target" && value !== "_blank") child.setAttribute("target", "_self");
              if (name === "target" && value === "_blank") child.setAttribute("rel", "noopener noreferrer");
              return;
            }
            if (tag === "IMG") {
              const allowed = new Set(["src", "alt"]);
              if (!allowed.has(name)) child.removeAttribute(attr.name);
              if (name === "src" && /^(javascript:|data:text\/html)/i.test(value)) child.removeAttribute(attr.name);
              return;
            }
            if (tag === "SPAN" && name === "style") return;
            child.removeAttribute(attr.name);
          });
          walk(child);
          return;
        }
        if (child.nodeType === Node.COMMENT_NODE) {
          child.remove();
        }
      });
    };
    walk(template.content);
    return template.innerHTML.trim();
  }

  function buildDetailEditorPopupHtml(sessionId, draftKey) {
    return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>상세페이지 고급 에디터</title>
  <style>
    :root{
      --bg:#f4f7fb; --surface:#ffffff; --line:#d8e1ec; --text:#1f2937; --muted:#6b7280;
      --accent:#2b8cff; --accent2:#0aa9d6; --soft:#f3f8ff;
    }
    *{box-sizing:border-box}
    body{margin:0;background:var(--bg);color:var(--text);font-family:SUIT, Pretendard, "Noto Sans KR", sans-serif;}
    .wrap{display:grid;grid-template-rows:auto auto 1fr;height:100vh}
    .head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-bottom:1px solid var(--line);background:#fff}
    .title{font-size:16px;font-weight:900;letter-spacing:-.01em}
    .sub{font-size:12px;color:var(--muted)}
    .actions{display:flex;gap:8px}
    button{height:34px;padding:0 12px;border-radius:10px;border:1px solid #d3dce8;background:#fff;color:#1f2937;font-size:12px;font-weight:700;cursor:pointer}
    .btnPrimary{border:0;background:linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);color:#fff;box-shadow:0 10px 18px rgba(43,140,255,.25)}
    .toolbar{padding:8px;display:flex;flex-wrap:wrap;gap:6px;border-bottom:1px solid var(--line);background:var(--soft)}
    .toolbar .group{display:flex;gap:6px;padding-right:8px;margin-right:8px;border-right:1px dashed #cfdae7}
    .toolbar .group:last-child{border-right:0;margin-right:0;padding-right:0}
    .toolbar input[type="color"]{width:34px;height:34px;padding:2px;border:1px solid #d3dce8;border-radius:8px;background:#fff;cursor:pointer}
    .tabs{display:flex;gap:6px;padding:8px;border-bottom:1px solid var(--line);background:#fff}
    .tabs button.active{color:#fff;border-color:transparent;background:linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%)}
    .body{display:grid;grid-template-columns:220px 1fr;gap:10px;padding:10px;min-height:0}
    .side{border:1px solid var(--line);border-radius:12px;background:#fff;padding:10px;overflow:auto}
    .side h4{margin:0 0 8px;font-size:13px}
    .side p{margin:0 0 8px;font-size:11px;color:var(--muted);line-height:1.45}
    .side .blockBtn{width:100%;margin-bottom:6px;text-align:left}
    .main{border:1px solid var(--line);border-radius:12px;background:#fff;overflow:hidden;min-height:0;display:grid}
    #sheetEditor,#sheetPreview{padding:12px;overflow:auto;min-height:0}
    #sheetEditor{outline:none;font-size:14px;line-height:1.65}
    #sheetEditor:empty::before{content:"여기에 상세페이지 콘텐츠를 작성하세요.";color:#98a2b3}
    #sheetEditor table,#sheetPreview table{width:100%;border-collapse:collapse;margin:8px 0}
    #sheetEditor td,#sheetEditor th,#sheetPreview td,#sheetPreview th{border:1px solid #cad5e3;padding:8px;min-width:70px}
    #sheetEditor h2,#sheetPreview h2{font-size:24px;margin:12px 0 8px}
    #sheetEditor h3,#sheetPreview h3{font-size:19px;margin:10px 0 7px}
    #sheetEditor p,#sheetPreview p{margin:7px 0}
    #sheetEditor img,#sheetPreview img{max-width:100%;height:auto;border:1px solid #d8dee8;border-radius:8px;margin:8px 0}
    #sheetPreview{font-size:14px;line-height:1.65;display:none}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <div>
        <div class="title">상세페이지 고급 에디터</div>
        <div class="sub">표/서식/템플릿 블록을 빠르게 구성하세요. · <span id="draftState">초안 준비중</span></div>
      </div>
      <div class="actions">
        <button id="btnDraftRestore">초안 복구</button>
        <button id="btnDraftClear">초안 삭제</button>
        <button id="btnApply">적용</button>
        <button class="btnPrimary" id="btnApplyClose">적용 후 닫기</button>
      </div>
    </div>
    <div>
      <div class="toolbar">
        <div class="group">
          <button data-cmd="undo">Undo</button><button data-cmd="redo">Redo</button>
        </div>
        <div class="group">
          <button data-cmd="formatBlock" data-val="P">본문</button>
          <button data-cmd="formatBlock" data-val="H2">H2</button>
          <button data-cmd="formatBlock" data-val="H3">H3</button>
          <button data-cmd="formatBlock" data-val="BLOCKQUOTE">인용</button>
        </div>
        <div class="group">
          <button data-cmd="bold">B</button><button data-cmd="italic">I</button><button data-cmd="underline">U</button><button data-cmd="strikeThrough">S</button>
        </div>
        <div class="group">
          <button data-cmd="justifyLeft">왼쪽</button><button data-cmd="justifyCenter">가운데</button><button data-cmd="justifyRight">오른쪽</button>
        </div>
        <div class="group">
          <button data-cmd="insertUnorderedList">UL</button><button data-cmd="insertOrderedList">OL</button><button data-action="hr">구분선</button>
        </div>
        <div class="group">
          <button data-action="table">3x3 표</button><button data-action="link">링크</button><button data-action="image">이미지</button>
        </div>
        <div class="group">
          <input type="color" id="txtColor" title="글자색" />
          <input type="color" id="bgColor" title="배경색" />
        </div>
      </div>
      <div class="tabs">
        <button id="tabEdit" class="active">편집</button>
        <button id="tabPreview">미리보기</button>
      </div>
    </div>
    <div class="body">
      <aside class="side">
        <h4>템플릿 블록</h4>
        <p>클릭하면 커서 위치에 블록이 삽입됩니다.</p>
        <button class="blockBtn" data-block="shipping">배송안내 블록</button>
        <button class="blockBtn" data-block="production">제작안내 블록</button>
        <button class="blockBtn" data-block="notice">주의사항 블록</button>
        <button class="blockBtn" data-block="faq">FAQ 블록</button>
      </aside>
      <section class="main">
        <div id="sheetEditor" contenteditable="true" spellcheck="true"></div>
        <div id="sheetPreview"></div>
      </section>
    </div>
  </div>
  <script>
    const SESSION_ID = ${JSON.stringify(sessionId)};
    const DRAFT_KEY = ${JSON.stringify(draftKey)};
    const editor = document.getElementById("sheetEditor");
    const preview = document.getElementById("sheetPreview");
    const tabEdit = document.getElementById("tabEdit");
    const tabPreview = document.getElementById("tabPreview");
    const draftState = document.getElementById("draftState");
    const btnDraftRestore = document.getElementById("btnDraftRestore");
    const btnDraftClear = document.getElementById("btnDraftClear");
    const blocks = {
      shipping: '<h3>배송 안내</h3><ul><li>평균 출고: 결제 후 2~4영업일</li><li>주문 제작 특성상 제작 시작 후 취소가 제한될 수 있습니다.</li></ul>',
      production: '<h3>제작 안내</h3><ul><li>이미지 해상도에 따라 인쇄 품질이 달라질 수 있습니다.</li><li>모니터 환경에 따라 색상 차이가 발생할 수 있습니다.</li></ul>',
      notice: '<h3>주의사항</h3><ul><li>핵심 요소는 안전영역 안에 배치해 주세요.</li><li>저작권 문제가 없는 소재만 사용해 주세요.</li></ul>',
      faq: '<h3>자주 묻는 질문</h3><p><strong>Q.</strong> 제작 기간은 얼마나 걸리나요?</p><p><strong>A.</strong> 보통 2~4영업일 내 출고됩니다.</p>'
    };
    function setDraftState(text){
      if(draftState) draftState.textContent = text;
    }
    function loadDraft(){
      try{
        const raw = localStorage.getItem(DRAFT_KEY);
        if(!raw) return null;
        const data = JSON.parse(raw);
        if(!data || typeof data.html !== 'string') return null;
        return data;
      }catch(_){
        return null;
      }
    }
    function saveDraftNow(){
      try{
        const payload = { html: editor.innerHTML || '', updatedAt: new Date().toISOString() };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
        const t = new Date(payload.updatedAt).toLocaleTimeString();
        setDraftState('자동저장됨 ' + t);
      }catch(_){
        setDraftState('초안 저장 실패');
      }
    }
    let draftTimer = null;
    function scheduleDraftSave(){
      setDraftState('저장중...');
      if(draftTimer) clearTimeout(draftTimer);
      draftTimer = setTimeout(saveDraftNow, 650);
    }
    function renderPreview(){
      preview.innerHTML = editor.innerHTML || '<p>미리보기 내용이 없습니다.</p>';
    }
    function exec(cmd, val){
      editor.focus();
      if(cmd === 'formatBlock'){
        document.execCommand('formatBlock', false, val || 'P');
      } else {
        document.execCommand(cmd, false, val || null);
      }
      renderPreview();
    }
    function insertHtml(html){
      editor.focus();
      document.execCommand('insertHTML', false, html);
      renderPreview();
    }
    document.querySelectorAll('[data-cmd]').forEach((btn)=>{
      btn.addEventListener('click', ()=>exec(btn.getAttribute('data-cmd'), btn.getAttribute('data-val') || ''));
    });
    document.querySelectorAll('[data-action]').forEach((btn)=>{
      btn.addEventListener('click', ()=>{
        const action = btn.getAttribute('data-action');
        if(action === 'hr'){ insertHtml('<hr />'); return; }
        if(action === 'table'){ insertHtml('<table><thead><tr><th>항목</th><th>내용</th><th>비고</th></tr></thead><tbody><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>'); return; }
        if(action === 'link'){ const u = prompt('링크 URL', 'https://'); if(u) document.execCommand('createLink', false, u); renderPreview(); return; }
        if(action === 'image'){ const u = prompt('이미지 URL', 'https://'); if(u) document.execCommand('insertImage', false, u); renderPreview(); return; }
      });
    });
    document.querySelectorAll('[data-block]').forEach((btn)=>{
      btn.addEventListener('click', ()=>{
        const key = btn.getAttribute('data-block');
        if(blocks[key]) insertHtml(blocks[key]);
      });
    });
    document.getElementById('txtColor').addEventListener('input', (e)=>exec('foreColor', e.target.value));
    document.getElementById('bgColor').addEventListener('input', (e)=>exec('hiliteColor', e.target.value));
    editor.addEventListener('input', ()=>{ renderPreview(); scheduleDraftSave(); });
    tabEdit.addEventListener('click', ()=>{
      editor.style.display = 'block'; preview.style.display = 'none';
      tabEdit.classList.add('active'); tabPreview.classList.remove('active');
    });
    tabPreview.addEventListener('click', ()=>{
      renderPreview();
      editor.style.display = 'none'; preview.style.display = 'block';
      tabEdit.classList.remove('active'); tabPreview.classList.add('active');
    });
    document.getElementById('btnApply').addEventListener('click', ()=>{
      saveDraftNow();
      if(window.opener){
        window.opener.postMessage({ type:'LF_DETAIL_EDITOR_APPLY', sessionId: SESSION_ID, html: editor.innerHTML || '' }, '*');
      }
    });
    document.getElementById('btnApplyClose').addEventListener('click', ()=>{
      saveDraftNow();
      if(window.opener){
        window.opener.postMessage({ type:'LF_DETAIL_EDITOR_APPLY', sessionId: SESSION_ID, html: editor.innerHTML || '', close: true }, '*');
      }
      window.close();
    });
    btnDraftRestore.addEventListener('click', ()=>{
      const draft = loadDraft();
      if(!draft || !String(draft.html || '').trim()){
        alert('복구할 초안이 없습니다.');
        return;
      }
      editor.innerHTML = draft.html;
      renderPreview();
      setDraftState('초안 복구됨');
    });
    btnDraftClear.addEventListener('click', ()=>{
      const ok = confirm('이 에디터의 저장된 초안을 삭제할까요?');
      if(!ok) return;
      localStorage.removeItem(DRAFT_KEY);
      setDraftState('초안 삭제됨');
    });
    window.addEventListener('beforeunload', ()=>{ saveDraftNow(); });
    window.addEventListener('message', (event)=>{
      const data = event.data || {};
      if(data.type !== 'LF_DETAIL_EDITOR_INIT' || data.sessionId !== SESSION_ID) return;
      const incoming = String(data.html || '<p></p>');
      editor.innerHTML = incoming;
      const draft = loadDraft();
      if(draft && String(draft.html || '').trim()){
        const incomingPlain = incoming.replace(/<[^>]+>/g, '').trim();
        if(!incomingPlain){
          editor.innerHTML = draft.html;
          setDraftState('초안 자동복구됨');
        } else {
          setDraftState('초안 있음 · 복구 버튼 사용');
        }
      } else {
        setDraftState('초안 없음');
      }
      renderPreview();
    });
    if(window.opener){
      window.opener.postMessage({ type:'LF_DETAIL_EDITOR_READY', sessionId: SESSION_ID }, '*');
    }
  </script>
</body>
</html>`;
  }

  function uid(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`;
  }

  function getProduct(productId) {
    const catalog = getCatalogProducts();
    return catalog.find((p) => p.id === productId) || catalog[0] || SEED_PRODUCTS[0];
  }

  function defaultSelection(product) {
    const opts = product?.options || DEFAULT_OPTIONS;
    return {
      size: opts.size[0],
      color: opts.color[0],
      material: opts.material[0]
    };
  }

  function getSelection(productId) {
    const product = getProduct(productId);
    const saved = state.selections[productId];
    if (!saved) return defaultSelection(product);
    const next = {};
    Object.keys(product.options).forEach((k) => {
      const arr = product.options[k];
      const match = arr.find((x) => x.value === saved[k]?.value);
      next[k] = match || arr[0];
    });
    return next;
  }

  function setSelection(productId, selection) {
    state.selections[productId] = selection;
    saveJson(STORE_KEYS.selections, state.selections);
  }

  function getQuantity(productId) {
    const v = Number(state.quantities[productId] || 1);
    return Number.isFinite(v) ? Math.max(1, Math.floor(v)) : 1;
  }

  function setQuantity(productId, qty) {
    state.quantities[productId] = Math.max(1, Math.floor(Number(qty) || 1));
    saveJson(STORE_KEYS.quantities, state.quantities);
  }

  function calcPrice(product, selection) {
    const delta = Object.values(selection).reduce((sum, x) => sum + Number(x.delta || 0), 0);
    return { base: product.basePrice, delta, total: product.basePrice + delta };
  }

  function parseRoute() {
    const raw = (location.hash || "#/").slice(1);
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    const parts = path.split("/").filter(Boolean);
    if (path === "/" || path === "") return { key: "/", pageId: PAGE_MAP["/"], params: {} };
    if (path === "/products") return { key: "/products", pageId: PAGE_MAP["/products"], params: {} };
    if (parts[0] === "products" && parts[1] === "category" && parts[2]) {
      return {
        key: "/products/category/:categorySlug",
        pageId: PAGE_MAP["/products"],
        params: { categorySlug: safeDecodeUriSegment(parts[2]) }
      };
    }
    if (parts[0] === "products" && parts[1]) {
      return {
        key: "/products/:id",
        pageId: PAGE_MAP["/products/:id"],
        params: { id: safeDecodeUriSegment(parts[1]) }
      };
    }
    if (parts[0] === "editor" && parts[1]) {
      return {
        key: "/editor/:productId",
        pageId: PAGE_MAP["/editor/:productId"],
        params: { productId: safeDecodeUriSegment(parts[1]) }
      };
    }
    if (path === "/my-submissions") return { key: "/my-submissions", pageId: PAGE_MAP["/my-submissions"], params: {} };
    if (path === "/admin/login") return { key: "/admin/login", pageId: PAGE_MAP["/admin/login"], params: {} };
    if (path === "/admin/products") return { key: "/admin/products", pageId: PAGE_MAP["/admin/products"], params: {} };
    if (path === "/admin/products/new") return { key: "/admin/products/new", pageId: PAGE_MAP["/admin/products/new"], params: {} };
    if (parts[0] === "admin" && parts[1] === "products" && parts[2] && parts[3] === "edit") {
      return {
        key: "/admin/products/:id/edit",
        pageId: PAGE_MAP["/admin/products/:id/edit"],
        params: { id: safeDecodeUriSegment(parts[2]) }
      };
    }
    if (path === "/admin/templates") return { key: "/admin/templates", pageId: PAGE_MAP["/admin/templates"], params: {} };
    if (path === "/admin/options") return { key: "/admin/options", pageId: PAGE_MAP["/admin/options"], params: {} };
    if (path === "/admin/inbox") return { key: "/admin/inbox", pageId: PAGE_MAP["/admin/inbox"], params: {} };
    if (parts[0] === "admin" && parts[1] === "inbox" && parts[2]) {
      return {
        key: "/admin/inbox/:submissionId",
        pageId: PAGE_MAP["/admin/inbox/:submissionId"],
        params: { submissionId: safeDecodeUriSegment(parts[2]) }
      };
    }
    return { key: "/", pageId: PAGE_MAP["/"], params: {} };
  }

  function activateRouteNav(routeKey) {
    routeLinks.forEach((a) => {
      const base = a.getAttribute("data-route");
      const isActive = routeKey === base || (base === "/admin" && routeKey.startsWith("/admin")) || (base === "/editor" && routeKey.startsWith("/editor"));
      a.classList.toggle("active", isActive);
    });
  }

  function bindProductCardDetailNavigation(root) {
    if (!root) return;
    root.querySelectorAll(".productCard[data-product-id]").forEach((card) => {
      const productId = String(card.dataset.productId || "").trim();
      if (!productId) return;
      card.setAttribute("role", "link");
      card.setAttribute("tabindex", "0");
      card.addEventListener("click", (e) => {
        if (e.target && e.target.closest(".productCustomizeLink")) return;
        location.hash = `#/products/${productId}`;
      });
      card.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        location.hash = `#/products/${productId}`;
      });
    });
  }

  function renderCards(targetId, items) {
    const root = document.getElementById(targetId);
    if (!root) return;
    root.innerHTML = "";
    if (!items.length) {
      root.innerHTML = `<div class="section" style="grid-column:1/-1">표시할 상품이 없습니다.</div>`;
      return;
    }
    items.forEach((p) => {
      const card = document.createElement("article");
      card.className = "productCard";
      card.dataset.productId = p.id;
      card.innerHTML = `
        <div class="thumbMock">
          <span class="thumbLabel">${esc(p.mockups[0] || "")}</span>
          <div class="thumbMeta">
            <h3>${esc(p.name)}</h3>
            <p>${esc(p.description)}</p>
          </div>
        </div>
        <div class="cardMeta">
          <span>${won(p.basePrice)}</span>
        </div>
        <div class="heroActions">
          <a class="btn productCustomizeLink" href="#/editor/${encodeURIComponent(p.id)}">Customize</a>
        </div>
      `;
      root.appendChild(card);
    });
    bindProductCardDetailNavigation(root);
  }

  function renderProductsPage() {
    const all = getCatalogProducts().filter((p) => p.isPublished !== false);
    const categories = getOrderedStoreCategories();
    const titleEl = document.querySelector("#page-products .routeTitle");
    const descEl = document.querySelector("#page-products .routeDesc");
    const filterBar = document.getElementById("productsCategoryFilter");
    const grid = document.getElementById("productsGrid");
    if (grid) grid.classList.remove("categoryMode");
    if (titleEl) titleEl.textContent = "Product List";
    if (descEl) descEl.textContent = "카드에서 상세로 이동 후 Customize를 시작하세요.";
    if (filterBar) filterBar.style.display = "";
    let category = normalizeCategoryFilter(state.productFilters.category);
    if (!all.some((p) => p.category === category) && category !== "all") {
      category = "all";
      setProductCategoryFilter("all");
    }

    if (filterBar) {
      const buttons = [{ key: "all", label: `전체 (${all.length})` }].concat(
        categories.map((name) => ({
          key: name,
          label: `${name} (${all.filter((p) => p.category === name).length})`
        }))
      );
      filterBar.innerHTML = buttons
        .map((btn) => `<button class="adminFilterBtn${btn.key === category ? " active" : ""}" type="button" data-category-filter="${esc(btn.key)}">${esc(btn.label)}</button>`)
        .join("");
      filterBar.querySelectorAll("[data-category-filter]").forEach((btn) => {
        btn.addEventListener("click", () => {
          setProductCategoryFilter(btn.dataset.categoryFilter || "all");
          syncTopCategoryNav();
          renderProductsPage();
        });
      });
    }

    const filtered = category === "all" ? all : all.filter((p) => p.category === category);
    renderCards("productsGrid", filtered);
    syncTopCategoryNav();
  }

  function samplePrice(categoryIndex, typeIndex, itemIndex) {
    return 5900 + categoryIndex * 800 + typeIndex * 1700 + itemIndex * 600;
  }

  function ensureCategorySampleProductsInStore() {
    if (state.allProductsDeleted) return;
    const editorProducts = loadEditorProducts();
    const byId = new Map(editorProducts.map((p, idx) => [p.id, idx]));
    const nextMeta = { ...state.productMeta };
    let changedProducts = false;
    let changedMeta = false;

    const categories = getOrderedStoreCategories();
    categories.forEach((categoryName, categoryIndex) => {
      const types = getCategorySampleTypes(categoryName);
      types.forEach((typeName, typeIndex) => {
        for (let itemIndex = 0; itemIndex < 4; itemIndex += 1) {
          const sampleId = `sample_${categoryToSlug(categoryName)}_${typeIndex + 1}_${itemIndex + 1}`;
          const sampleName = `${typeName} 샘플 ${itemIndex + 1}`;
          const samplePriceValue = samplePrice(categoryIndex, typeIndex, itemIndex);
          const desiredProduct = {
            id: sampleId,
            name: sampleName,
            canvasMode: "fit",
            category: categoryName,
            basePrice: samplePriceValue,
            isPublished: true
          };
          const foundIndex = byId.has(sampleId) ? byId.get(sampleId) : -1;
          if (foundIndex === -1) {
            editorProducts.push(desiredProduct);
            byId.set(sampleId, editorProducts.length - 1);
            changedProducts = true;
          } else {
            const existing = editorProducts[foundIndex];
            const patched = {
              ...existing,
              name: sampleName,
              canvasMode: "fit",
              category: categoryName,
              basePrice: samplePriceValue,
              isPublished: true
            };
            if (
              existing.name !== patched.name ||
              existing.canvasMode !== patched.canvasMode ||
              existing.category !== patched.category ||
              Number(existing.basePrice || 0) !== patched.basePrice ||
              existing.isPublished !== true
            ) {
              editorProducts[foundIndex] = patched;
              changedProducts = true;
            }
          }

          const desiredMeta = {
            category: categoryName,
            subcategory: typeName,
            basePrice: samplePriceValue,
            tags: [typeName, "샘플"],
            mockups: ["Front", "Back", "Detail"],
            description: `${typeName} 샘플 상품`,
            options: DEFAULT_OPTIONS,
            isPublished: true
          };
          const prevMeta = normalizeMeta(nextMeta[sampleId], desiredMeta);
          const mergedMeta = {
            ...prevMeta,
            category: categoryName,
            subcategory: typeName,
            basePrice: samplePriceValue,
            tags: [typeName, "샘플"],
            mockups: ["Front", "Back", "Detail"],
            description: `${typeName} 샘플 상품`,
            options: normalizeOptions(prevMeta.options, DEFAULT_OPTIONS),
            isPublished: true
          };
          if (JSON.stringify(prevMeta) !== JSON.stringify(mergedMeta)) {
            nextMeta[sampleId] = mergedMeta;
            changedMeta = true;
          }
        }
      });
    });

    if (changedProducts) {
      saveEditorProducts(editorProducts);
    }
    if (changedMeta) {
      state.productMeta = nextMeta;
      saveJson(STORE_KEYS.productMeta, state.productMeta);
    }
  }

  function buildCategorySamples(categoryName) {
    const types = getCategorySampleTypes(categoryName);
    const catalog = getCatalogProducts().filter((p) => p.isPublished !== false);
    const categoryCatalog = catalog.filter((p) => p.category === categoryName);
    const fallback = categoryCatalog[0]?.id || catalog[0]?.id || "default_product";
    const categoryIndex = Math.max(0, STORE_CATEGORIES.indexOf(categoryName));
    return types.slice(0, 3).map((typeName, typeIndex) => {
      const picked = categoryCatalog
        .filter((p) => String(p.subcategory || "").trim() === typeName)
        .slice(0, 4);
      const items = picked.length
        ? picked.map((p, i) => ({
          name: p.name,
          description: p.description || `${typeName} 상품`,
          basePrice: p.basePrice,
          mockup: p.mockups?.[0] || (i % 2 === 0 ? "Front" : "Detail"),
          productId: p.id
        }))
        : Array.from({ length: 4 }).map((_, itemIndex) => ({
          name: `${typeName} 샘플 ${itemIndex + 1}`,
          description: `${typeName} 샘플 상품`,
          basePrice: samplePrice(categoryIndex, typeIndex, itemIndex),
          mockup: itemIndex % 2 === 0 ? "Front" : "Detail",
          productId: categoryCatalog[itemIndex % Math.max(1, categoryCatalog.length)]?.id || fallback
        }));
      return { typeName, items };
    });
  }

  function renderProductsCategoryPage(categoryName) {
    const normalized = normalizeStoreCategory(categoryName);
    setProductCategoryFilter(normalized);

    const titleEl = document.querySelector("#page-products .routeTitle");
    const descEl = document.querySelector("#page-products .routeDesc");
    const filterBar = document.getElementById("productsCategoryFilter");
    const grid = document.getElementById("productsGrid");
    if (!grid) return;
    grid.classList.add("categoryMode");

    if (titleEl) titleEl.textContent = `${normalized}`;
    if (descEl) descEl.textContent = `${normalized} 상품 페이지 · 하위카테고리별 상품`;
    if (filterBar) filterBar.style.display = "none";

    const sections = buildCategorySamples(normalized);
    grid.innerHTML = `
      <div class="categoryShowcase">
        ${sections.map((section) => `
          <section class="categoryShowcaseBlock">
            <div class="categoryShowcaseHead">
              <h3>${esc(section.typeName)}</h3>
            </div>
            <div class="sectionGrid">
              ${section.items.map((item) => `
                <article class="productCard" data-product-id="${esc(item.productId)}">
                  <div class="thumbMock">
                    <span class="thumbLabel">${esc(item.mockup)}</span>
                    <div class="thumbMeta">
                      <h3>${esc(item.name)}</h3>
                      <p>${esc(item.description)}</p>
                    </div>
                  </div>
                  <div class="cardMeta">
                    <span>${won(item.basePrice)}</span>
                  </div>
                  <div class="heroActions">
                    <a class="btn productCustomizeLink" href="#/editor/${encodeURIComponent(item.productId)}">Customize</a>
                  </div>
                </article>
              `).join("")}
            </div>
          </section>
        `).join("")}
      </div>
    `;
    bindProductCardDetailNavigation(grid);
    syncTopCategoryNav();
  }

  function renderHomeExperience() {
    const published = getCatalogProducts().filter((p) => p.isPublished !== false);
    const categories = getOrderedStoreCategories();
    renderCards("homeFeatured", published.slice(0, 6));

    const categoryGrid = document.getElementById("homeCategoryGrid");
    if (categoryGrid) {
      const entries = categories.map((category) => ({
        category,
        count: published.filter((p) => p.category === category).length
      }));
      categoryGrid.innerHTML = entries.length
        ? entries.map((x) => `
          <a class="homeCategoryCard" href="#/products" data-home-category="${esc(x.category)}">
            <h3>${esc(x.category)}</h3>
            <p>${esc(x.count)}개 상품 · 맞춤 제작 가능</p>
          </a>
        `).join("")
        : `<div class="homeCategoryCard"><h3>카테고리 준비중</h3><p>곧 다양한 상품군이 추가됩니다.</p></div>`;
      categoryGrid.querySelectorAll("[data-home-category]").forEach((a) => {
        a.addEventListener("click", (e) => {
          e.preventDefault();
          applyCategoryAndRoute(a.dataset.homeCategory || "");
        });
      });
    }

  }

  function getStorePulseStats() {
    const published = getCatalogProducts().filter((p) => p.isPublished !== false);
    const now = Date.now();
    const recentWindowMs = 30 * 24 * 60 * 60 * 1000;
    const recent = state.submissions.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return Number.isFinite(t) && (now - t) <= recentWindowMs;
    });
    const processed = recent.filter((s) => String(s.status || "").toLowerCase() !== "received");
    const processingRate = recent.length ? Math.round((processed.length / recent.length) * 100) : 0;
    const templateCount = loadEditorTemplates().length;
    return [
      { label: "최근 30일 제출 건수", value: `${recent.length}건`, meta: "인박스 기준" },
      { label: "인박스 처리율", value: `${processingRate}%`, meta: `${processed.length}/${recent.length || 0} 처리` },
      { label: "전시 상품 수", value: String(published.length), meta: "스토어 공개 기준" },
      { label: "연결 템플릿 페이지", value: String(templateCount), meta: "제작 템플릿 기준" }
    ];
  }

  function renderAdminStorePulse() {
    const root = document.getElementById("adminStoreStats");
    if (!root) return;
    const stats = getStorePulseStats();
    root.innerHTML = stats.map((s) => `
      <div class="homeStatItem">
        <div class="homeStatLabel">${s.label}</div>
        <div class="homeStatValue">${s.value}</div>
        <div class="homeStatMeta">${s.meta || ""}</div>
      </div>
    `).join("");
  }

  function renderAdminProductsWorkspace() {
    const summaryRoot = document.getElementById("adminProductsSummary");
    const topQuickRoot = document.getElementById("adminQuickLinks");
    const sideQuickRoot = document.getElementById("adminQuickLinksSide");
    const updatedEl = document.getElementById("adminWorkspaceUpdated");
    const viewAllBtn = document.getElementById("adminViewAllBtn");
    const filterBar = document.getElementById("adminProductsFilter");

    const catalog = getCatalogProducts();
    const published = catalog.filter((p) => p.isPublished !== false).length;
    const hidden = Math.max(0, catalog.length - published);
    const categories = getOrderedStoreCategories().length;
    const templates = loadEditorTemplates().length;
    const recent30 = state.submissions.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return Number.isFinite(t) && (Date.now() - t) <= (30 * 24 * 60 * 60 * 1000);
    }).length;

    if (summaryRoot) {
      summaryRoot.innerHTML = [
        { label: "전체 상품", value: `${catalog.length}개`, meta: "등록 상품 기준" },
        { label: "공개/비공개", value: `${published}/${hidden}`, meta: "공개 · 비공개" },
        { label: "카테고리", value: `${categories}개`, meta: "메뉴 포함" },
        { label: "템플릿 페이지", value: `${templates}개`, meta: "연결 템플릿" },
        { label: "최근 30일 요청", value: `${recent30}건`, meta: "인박스 기준" }
      ].map((item) => `
        <article class="adminSummaryCard">
          <div class="adminSummaryLabel">${item.label}</div>
          <div class="adminSummaryValue">${item.value}</div>
          <div class="adminSummaryMeta">${item.meta}</div>
        </article>
      `).join("");
    }

    const links = [
      { title: "상품 현황", target: "adminSectionCatalog", filter: "all" },
      { title: "연결 설정", target: "adminSectionConnection", filter: "connection" },
      { title: "상품 입력", target: "adminSectionProduct", filter: "product" },
      { title: "메뉴 순서", target: "adminSectionMenu", filter: "menu" },
      { title: "하위카테고리", target: "adminSectionSubcategory", filter: "subcategory" },
      { title: "에셋 등록", target: "adminSectionAsset", filter: "asset" }
    ];
    const linkMarkup = links.map((x) => (
      `<button class="adminQuickLinkBtn" type="button" data-admin-scroll="${x.target}" data-admin-filter-jump="${x.filter}">${x.title}</button>`
    )).join("");
    if (topQuickRoot) topQuickRoot.innerHTML = linkMarkup;
    if (sideQuickRoot) sideQuickRoot.innerHTML = linkMarkup;

    const bindQuickLinks = (root) => {
      if (!root || root.dataset.bound === "1") return;
      root.dataset.bound = "1";
      root.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-admin-scroll]");
        if (!btn) return;
        const targetId = String(btn.getAttribute("data-admin-scroll") || "").trim();
        const filterKey = String(btn.getAttribute("data-admin-filter-jump") || "all").trim();
        if (filterBar) {
          const filterBtn = filterBar.querySelector(`[data-admin-filter="${filterKey}"]`) || filterBar.querySelector('[data-admin-filter="all"]');
          if (filterBtn) filterBtn.click();
        }
        const target = document.getElementById(targetId);
        if (!target) return;
        const toggle = target.querySelector(".adminAccordionToggle");
        if (toggle && toggle.getAttribute("aria-expanded") !== "true") {
          toggle.click();
        }
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    bindQuickLinks(topQuickRoot);
    bindQuickLinks(sideQuickRoot);

    if (updatedEl) {
      updatedEl.textContent = `업데이트 ${new Date().toLocaleTimeString()}`;
    }

    if (filterBar && filterBar.dataset.workspaceInit !== "1") {
      const allBtn = filterBar.querySelector('[data-admin-filter="all"]');
      if (allBtn) allBtn.click();
      filterBar.dataset.workspaceInit = "1";
    }

    if (viewAllBtn && !viewAllBtn.dataset.bound) {
      viewAllBtn.dataset.bound = "1";
      viewAllBtn.addEventListener("click", () => {
        if (filterBar) {
          const allBtn = filterBar.querySelector('[data-admin-filter="all"]');
          if (allBtn) allBtn.click();
        }
        const adminSections = Array.from(document.querySelectorAll("#page-admin-products .section.adminAccordion"));
        adminSections.forEach((section) => {
          const toggle = section.querySelector(".adminAccordionToggle");
          if (toggle && toggle.getAttribute("aria-expanded") !== "true") {
            toggle.click();
          }
        });
        const topAnchor = document.getElementById("page-admin-products");
        if (topAnchor) topAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function renderProductDetail(id) {
    const product = getProduct(id);
    state.currentDetailProductId = product.id;
    const title = document.getElementById("detailTitle");
    const base = document.getElementById("detailBasePrice");
    const optionsRoot = document.getElementById("detailOptions");
    const summary = document.getElementById("detailPriceSummary");
    const finalCheck = document.getElementById("detailFinalCheck");
    const qtyInput = document.getElementById("detailQtyInput");
    const qtyMinus = document.getElementById("detailQtyMinus");
    const qtyPlus = document.getElementById("detailQtyPlus");
    const tabs = document.getElementById("mockupTabs");
    const view = document.getElementById("mockupView");
    const customize = document.getElementById("detailCustomizeBtn");
    const richRoot = document.getElementById("detailRichContent");
    if (!title || !base || !optionsRoot || !summary || !finalCheck || !qtyInput || !qtyMinus || !qtyPlus || !tabs || !view || !customize || !richRoot) return;

    const selection = getSelection(product.id);
    let qty = getQuantity(product.id);
    const optionLabelMap = { size: "사이즈", color: "컬러", material: "소재" };
    title.textContent = product.name;
    base.innerHTML = `<span class="priceCaption">예상 결제금액</span>${won(product.basePrice)}`;
    customize.href = `#/editor/${product.id}`;
    customize.textContent = "이 상품 커스터마이즈";

    const templates = loadEditorTemplates().filter((tpl) => tpl.productId === product.id);
    const templateViews = templates.map((tpl) => ({
      name: String(tpl.pageName || tpl.name || "View").trim() || "View",
      imageUrl: String(tpl.templateImageUrl || "").trim()
    }));
    const fallbackViews = (product.mockups || []).map((m) => ({ name: m, imageUrl: "" }));
    const views = templateViews.length ? templateViews : fallbackViews;

    tabs.innerHTML = "";
    views.forEach((m, idx) => {
      const b = document.createElement("button");
      b.className = idx === 0 ? "btn2 activeTab" : "btn2";
      b.type = "button";
      b.textContent = m.name;
      b.addEventListener("click", () => {
        tabs.querySelectorAll("button").forEach((x) => x.classList.remove("activeTab"));
        b.classList.add("activeTab");
        if (m.imageUrl) {
          const safeSrc = sanitizeImageUrl(m.imageUrl);
          if (safeSrc) {
            view.innerHTML = `<img class="mockupPreviewImg" src="${safeSrc}" alt="${esc(product.name)} ${esc(m.name)}" /><div class="mockupCaption">${esc(product.name)} - ${esc(m.name)}</div>`;
          } else {
            view.textContent = `${product.name} - ${m.name} Mockup`;
          }
        } else {
          view.textContent = `${product.name} - ${m.name} Mockup`;
        }
      });
      tabs.appendChild(b);
    });
    if (views[0]?.imageUrl) {
      const safeSrc = sanitizeImageUrl(views[0].imageUrl);
      if (safeSrc) {
        view.innerHTML = `<img class="mockupPreviewImg" src="${safeSrc}" alt="${esc(product.name)} ${esc(views[0].name)}" /><div class="mockupCaption">${esc(product.name)} - ${esc(views[0].name)}</div>`;
      } else {
        view.textContent = `${product.name} - ${(views[0]?.name || "Front")} Mockup`;
      }
    } else {
      view.textContent = `${product.name} - ${(views[0]?.name || "Front")} Mockup`;
    }

    const richHtmlRaw = String(product.detailContent || "").trim();
    if (richHtmlRaw) {
      richRoot.innerHTML = sanitizeDetailHtml(richHtmlRaw);
    } else {
      richRoot.innerHTML = `<p>${esc(product.description || "상세 설명이 준비중입니다.")}</p>`;
    }

    function updatePriceAndStore() {
      const price = calcPrice(product, selection);
      const unitTotal = price.total;
      const orderTotal = unitTotal * qty;
      base.innerHTML = `<span class="priceCaption">예상 결제금액</span>${won(orderTotal)}`;
      summary.innerHTML = `
        <div class="summaryRow"><span>1개 단가</span><b>${won(unitTotal)}</b></div>
        <div class="summaryRow"><span>수량</span><b>${qty}개</b></div>
        <div class="summaryRow total"><span>총 결제예상</span><b>${won(orderTotal)}</b></div>
        <div class="summaryMeta">선택: ${esc(selection.size.value)} / ${esc(selection.color.value)} / ${esc(selection.material.value)}</div>
      `;
      const multiView = views.length > 1;
      const eta = multiView ? "3-5 영업일" : "2-4 영업일";
      finalCheck.innerHTML = `
        <div class="finalCheckTitle">주문 전 최종 확인</div>
        <div class="finalCheckRow"><span>선택 옵션</span><b>${esc(selection.size.value)} / ${esc(selection.color.value)} / ${esc(selection.material.value)}</b></div>
        <div class="finalCheckRow"><span>수량</span><b>${qty}개</b></div>
        <div class="finalCheckRow"><span>예상 제작</span><b>${eta}</b></div>
        <div class="finalCheckNote">디자인 확정 후 생산 파일 기준으로 제작이 진행됩니다.</div>
      `;
      setSelection(product.id, selection);
      setQuantity(product.id, qty);
    }

    optionsRoot.innerHTML = "";
    Object.entries(product.options).forEach(([k, arr]) => {
      const block = document.createElement("div");
      block.className = "optionBlock";
      block.innerHTML = `<label>${optionLabelMap[k] || k.toUpperCase()}</label>`;
      const row = document.createElement("div");
      row.className = "chipRow";
      arr.forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        const active = selection[k]?.value === opt.value;
        btn.className = active ? "btn2 detailChip activeTab" : "btn2 detailChip";
        btn.textContent = `${opt.value} ${opt.delta ? `( +${won(opt.delta)} )` : ""}`;
        btn.addEventListener("click", () => {
          row.querySelectorAll("button").forEach((x) => x.classList.remove("activeTab"));
          btn.classList.add("activeTab");
          selection[k] = opt;
          updatePriceAndStore();
        });
        row.appendChild(btn);
      });
      block.appendChild(row);
      optionsRoot.appendChild(block);
    });

    function applyQty(nextQty) {
      qty = Math.max(1, Math.floor(Number(nextQty) || 1));
      qtyInput.value = String(qty);
      updatePriceAndStore();
    }
    const isMobileQty = window.matchMedia("(max-width: 720px)").matches;
    qtyInput.readOnly = isMobileQty;
    qtyInput.inputMode = "numeric";
    qtyInput.setAttribute("aria-label", "수량");
    if (isMobileQty) {
      qtyInput.title = "모바일에서는 +/- 버튼으로 수량을 조절하세요.";
    } else {
      qtyInput.removeAttribute("title");
    }
    qtyInput.value = String(qty);
    qtyMinus.onclick = () => applyQty(qty - 1);
    qtyPlus.onclick = () => applyQty(qty + 1);
    qtyInput.oninput = () => {
      if (qtyInput.readOnly) {
        qtyInput.value = String(qty);
        return;
      }
      applyQty(qtyInput.value);
    };
    updatePriceAndStore();
  }

  function syncEditorProduct(productId) {
    const productSelect = document.getElementById("product");
    if (!productSelect || !productId) return;
    const hasOption = Array.from(productSelect.options).some((o) => o.value === productId);
    if (!hasOption) return;
    if (productSelect.value === productId) return;
    productSelect.value = productId;
    productSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function renderMySubmissions() {
    const tbody = document.getElementById("mySubmissionsBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    state.submissions.forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${esc(new Date(s.createdAt).toLocaleString())}</td><td>${esc(s.productName)}</td><td>${esc(s.optionsLabel)}</td><td><span class="statusChip">${esc(s.status)}</span></td>`;
      tbody.appendChild(tr);
    });
    if (!state.submissions.length) {
      tbody.innerHTML = `<tr><td colspan="4">제출 내역이 없습니다.</td></tr>`;
    }
  }

  function renderAdminProducts() {
    const root = document.getElementById("adminProductsByCategory");
    if (!root) return;
    const catalog = getCatalogProducts();
    const rawCategories = [...new Set(catalog.map((p) => p.category).filter(Boolean))];
    const orderedCategories = STORE_CATEGORIES.filter((x) => rawCategories.includes(x))
      .concat(rawCategories.filter((x) => !STORE_CATEGORY_SET.has(x)));
    const categoryList = orderedCategories.length ? orderedCategories : STORE_CATEGORIES;

    root.innerHTML = categoryList.map((category) => {
      const items = catalog.filter((p) => p.category === category);
      const publishedCount = items.filter((p) => p.isPublished).length;
      const accKey = `adminProductsCategory:${category}`;
      const open = state.adminAccordions[accKey] === true;
      const rows = items.length
        ? items.map((p) => `
          <tr>
            <td class="adminSelectCell">
              <label class="adminProductCheckLabel">
                <input type="checkbox" data-admin-product-check="${esc(p.id)}" aria-label="${esc(p.name)} 표시 선택" />
                <span>표시</span>
              </label>
            </td>
            <td>${esc(p.name)}</td>
            <td>${won(p.basePrice)}</td>
            <td><span class="statusChip ${p.isPublished ? "statusPublished" : "statusHidden"}">${p.isPublished ? "Published" : "Hidden"}</span></td>
            <td><a class="btn2" href="#/admin/products/${encodeURIComponent(p.id)}/edit">Edit</a></td>
          </tr>
        `).join("")
        : `<tr><td colspan="5">등록된 상품이 없습니다.</td></tr>`;
      return `
        <section class="adminCatAccordion${open ? "" : " is-collapsed"}" data-admin-cat="${esc(category)}" data-acc-key="${esc(accKey)}">
          <button type="button" class="adminCatAccordionToggle" aria-expanded="${open ? "true" : "false"}">
            <span class="adminCatAccordionTitle">${esc(category)} · 전체 ${items.length}개 / 공개 ${publishedCount}개</span>
            <span class="adminCatAccordionChevron" aria-hidden="true">⌄</span>
          </button>
          <div class="adminCatAccordionBody">
            <table class="dataTable adminCatTable">
              <thead><tr><th class="adminSelectHead"><label class="adminProductCheckLabel"><input type="checkbox" data-admin-check-all="${esc(category)}" aria-label="${esc(category)} 전체 선택" /><span>표시</span></label></th><th>Name</th><th>Base Price</th><th>Published</th><th>Actions</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </section>
      `;
    }).join("");

    root.querySelectorAll(".adminCatAccordionToggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const section = btn.closest(".adminCatAccordion");
        if (!section) return;
        const accKey = section.getAttribute("data-acc-key");
        const nextOpen = section.classList.contains("is-collapsed");
        section.classList.toggle("is-collapsed", !nextOpen);
        btn.setAttribute("aria-expanded", nextOpen ? "true" : "false");
        if (accKey) {
          state.adminAccordions[accKey] = nextOpen;
          saveJson(STORE_KEYS.adminAccordions, state.adminAccordions);
        }
      });
    });
    root.querySelectorAll("[data-admin-check-all]").forEach((checkAll) => {
      checkAll.addEventListener("change", () => {
        const section = checkAll.closest(".adminCatAccordion");
        if (!section) return;
        const checked = checkAll.checked;
        section.querySelectorAll("[data-admin-product-check]").forEach((chk) => {
          chk.checked = checked;
        });
      });
    });
    root.querySelectorAll("[data-admin-product-check]").forEach((checkItem) => {
      checkItem.addEventListener("change", () => {
        const section = checkItem.closest(".adminCatAccordion");
        if (!section) return;
        const all = section.querySelectorAll("[data-admin-product-check]");
        const on = section.querySelectorAll("[data-admin-product-check]:checked");
        const head = section.querySelector("[data-admin-check-all]");
        if (head) head.checked = all.length > 0 && on.length === all.length;
      });
    });
    renderAdminProductsWorkspace();
  }

  function renderAdminCategoryOrder() {
    const listRoot = document.getElementById("adminCategoryOrderList");
    const resetBtn = document.getElementById("adminCategoryOrderResetBtn");
    if (!listRoot) return;
    const categories = getOrderedStoreCategories();
    listRoot.innerHTML = categories.map((name, idx) => `
      <div class="adminCategoryOrderRow" data-name="${esc(name)}" data-order-index="${idx}" draggable="true">
        <span class="adminCategoryOrderIndex">${idx + 1}</span>
        <span class="adminCategoryOrderDrag" aria-hidden="true">⋮⋮</span>
        <span class="adminCategoryOrderName">${esc(name)}</span>
        <div class="adminCategoryOrderActions">
          <button class="btn2" type="button" data-order-action="up" data-order-name="${esc(name)}">위</button>
          <button class="btn2" type="button" data-order-action="down" data-order-name="${esc(name)}">아래</button>
          <button class="btn2 orderDeleteBtn" type="button" data-order-action="delete" data-order-name="${esc(name)}">삭제</button>
        </div>
      </div>
    `).join("");

    const refreshAfterOrderChange = () => {
      initTopCategoryNav();
      syncTopCategoryNav();
      renderProductsPage();
      renderHomeExperience();
      renderAdminCategoryOrder();
      renderAdminSubtypeSettings();
    };

    const applyMove = (name, dir) => {
      const order = getOrderedStoreCategories().slice();
      const from = order.indexOf(name);
      if (from < 0) return;
      const to = dir === "up" ? from - 1 : from + 1;
      if (to < 0 || to >= order.length) return;
      const next = order.slice();
      const temp = next[to];
      next[to] = next[from];
      next[from] = temp;
      saveAdminCategoryOrder(next);
      refreshAfterOrderChange();
    };

    const applyDropMove = (from, to) => {
      if (from === to || from < 0 || to < 0) return;
      const order = getOrderedStoreCategories().slice();
      if (from >= order.length || to >= order.length) return;
      const [picked] = order.splice(from, 1);
      order.splice(to, 0, picked);
      saveAdminCategoryOrder(order);
      refreshAfterOrderChange();
    };

    const removeCategory = (target) => {
      const currentOrder = getOrderedStoreCategories();
      if (currentOrder.length <= 1) {
        alert("최소 1개 카테고리는 유지되어야 합니다.");
        return;
      }
      const replacement = currentOrder.find((x) => x !== target) || STORE_CATEGORIES[0];
      const usingCount = getCatalogProducts().filter((p) => p.category === target).length;
      const ok = window.confirm(
        usingCount
          ? `"${target}" 카테고리를 삭제하면 ${usingCount}개 상품이 "${replacement}"로 변경됩니다. 계속할까요?`
          : `"${target}" 카테고리를 삭제할까요?`
      );
      if (!ok) return;

      const nextProducts = loadEditorProducts().map((p) => (
        p.category === target ? { ...p, category: replacement } : p
      ));
      saveEditorProducts(nextProducts);

      const nextMeta = { ...state.productMeta };
      Object.keys(nextMeta).forEach((pid) => {
        const meta = nextMeta[pid];
        if (!meta || meta.category !== target) return;
        nextMeta[pid] = {
          ...meta,
          category: replacement,
          tags: Array.isArray(meta.tags)
            ? meta.tags.map((tag) => (String(tag || "").trim() === target ? replacement : tag))
            : []
        };
      });
      state.productMeta = nextMeta;
      saveJson(STORE_KEYS.productMeta, state.productMeta);

      const custom = loadCustomStoreCategories().filter((x) => x !== target);
      saveCustomStoreCategories(custom);
      const deletedSet = new Set(Array.isArray(state.deletedCategories) ? state.deletedCategories : []);
      deletedSet.add(target);
      saveDeletedCategories([...deletedSet]);
      const subtypeMap = { ...(state.categorySubtypes && typeof state.categorySubtypes === "object" ? state.categorySubtypes : {}) };
      delete subtypeMap[target];
      state.categorySubtypes = subtypeMap;
      saveJson(STORE_KEYS.categorySubtypes, state.categorySubtypes);

      const order = currentOrder.filter((x) => x !== target);
      saveAdminCategoryOrder(order);

      if (state.productFilters.category === target) {
        setProductCategoryFilter(replacement);
      }

      refreshAfterOrderChange();
      window.dispatchEvent(new CustomEvent("lf:catalog-updated", { detail: { source: "router" } }));
    };

    listRoot.querySelectorAll("[data-order-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = String(btn.getAttribute("data-order-name") || "").trim();
        const action = String(btn.getAttribute("data-order-action") || "").trim();
        if (!name) return;
        if (action === "up" || action === "down") {
          applyMove(name, action);
          return;
        }
        if (action === "delete") {
          removeCategory(name);
        }
      });
    });

    let dragFrom = -1;
    listRoot.querySelectorAll(".adminCategoryOrderRow").forEach((row) => {
      row.addEventListener("dragstart", (e) => {
        dragFrom = Number(row.getAttribute("data-order-index"));
        row.classList.add("is-dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(dragFrom));
        }
      });
      row.addEventListener("dragover", (e) => {
        e.preventDefault();
        row.classList.add("is-drop-target");
      });
      row.addEventListener("dragleave", () => {
        row.classList.remove("is-drop-target");
      });
      row.addEventListener("drop", (e) => {
        e.preventDefault();
        row.classList.remove("is-drop-target");
        const to = Number(row.getAttribute("data-order-index"));
        const raw = e.dataTransfer?.getData("text/plain");
        const from = Number.isFinite(Number(raw)) ? Number(raw) : dragFrom;
        applyDropMove(from, to);
      });
      row.addEventListener("dragend", () => {
        dragFrom = -1;
        listRoot.querySelectorAll(".adminCategoryOrderRow").forEach((x) => {
          x.classList.remove("is-dragging", "is-drop-target");
        });
      });
    });

    if (resetBtn && !resetBtn.dataset.bound) {
      resetBtn.dataset.bound = "1";
      resetBtn.addEventListener("click", () => {
        saveAdminCategoryOrder([]);
        refreshAfterOrderChange();
      });
    }
  }

  function renderAdminSubtypeSettings() {
    const categoryEl = document.getElementById("adminSubtypeCategory");
    const inputEl = document.getElementById("adminSubtypeInput");
    const saveBtn = document.getElementById("adminSubtypeSaveBtn");
    const resetBtn = document.getElementById("adminSubtypeResetBtn");
    if (!categoryEl || !inputEl || !saveBtn || !resetBtn) return;

    const categories = getOrderedStoreCategories();
    const prev = String(categoryEl.value || "").trim();
    categoryEl.innerHTML = categories.map((name) => `<option value="${esc(name)}">${esc(name)}</option>`).join("");
    const selected = categories.includes(prev) ? prev : (categories[0] || "");
    categoryEl.value = selected;

    const syncInput = () => {
      const categoryName = normalizeStoreCategory(categoryEl.value);
      const types = getCategorySampleTypes(categoryName);
      inputEl.value = types.join(", ");
    };
    syncInput();

    if (!categoryEl.dataset.bound) {
      categoryEl.dataset.bound = "1";
      categoryEl.addEventListener("change", syncInput);
    }

    if (!saveBtn.dataset.bound) {
      saveBtn.dataset.bound = "1";
      saveBtn.addEventListener("click", () => {
        const categoryName = normalizeStoreCategory(categoryEl.value);
        const list = normalizeSubtypeList(String(inputEl.value || "").split(","));
        if (!list.length) {
          alert("하위카테고리를 최소 1개 이상 입력하세요.");
          return;
        }
        const next = {
          ...(state.categorySubtypes && typeof state.categorySubtypes === "object" ? state.categorySubtypes : {}),
          [categoryName]: list
        };
        state.categorySubtypes = next;
        saveJson(STORE_KEYS.categorySubtypes, state.categorySubtypes);
        renderProductsPage();
        if (state.currentRoute === "/products/category/:categorySlug") {
          renderProductsCategoryPage(state.currentParams.categorySlug ? slugToCategory(state.currentParams.categorySlug) : categoryName);
        }
        renderAdminSubtypeSettings();
      });
    }

    if (!resetBtn.dataset.bound) {
      resetBtn.dataset.bound = "1";
      resetBtn.addEventListener("click", () => {
        const categoryName = normalizeStoreCategory(categoryEl.value);
        const next = { ...(state.categorySubtypes && typeof state.categorySubtypes === "object" ? state.categorySubtypes : {}) };
        delete next[categoryName];
        state.categorySubtypes = next;
        saveJson(STORE_KEYS.categorySubtypes, state.categorySubtypes);
        syncInput();
        renderProductsPage();
        if (state.currentRoute === "/products/category/:categorySlug") {
          renderProductsCategoryPage(state.currentParams.categorySlug ? slugToCategory(state.currentParams.categorySlug) : categoryName);
        }
      });
    }
  }

  function splitCsv(text) {
    return String(text || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  function parseOptionLine(text, fallback) {
    const parsed = splitCsv(text)
      .map((chunk) => {
        const [left, right] = chunk.split(":");
        const value = String(left || "").trim();
        if (!value) return null;
        const deltaRaw = String(right || "0").trim().replace(/[^\d+-]/g, "");
        const delta = Number(deltaRaw || 0);
        return { value, delta: Number.isFinite(delta) ? delta : 0 };
      })
      .filter(Boolean);
    return parsed.length ? parsed : fallback;
  }

  function getLinkedTemplateIds(productId) {
    return loadEditorTemplates()
      .filter((tpl) => tpl.productId === productId)
      .map((tpl) => tpl.id);
  }

  function renderAdminProductForm(routeKey, params) {
    const idEl = document.getElementById("adminFormProductId");
    const nameEl = document.getElementById("adminFormProductName");
    const descEl = document.getElementById("adminFormDescription");
    const catEl = document.getElementById("adminFormCategory");
    const subcatEl = document.getElementById("adminFormSubcategory");
    const priceEl = document.getElementById("adminFormBasePrice");
    const tagsEl = document.getElementById("adminFormTags");
    const sizeEl = document.getElementById("adminFormOptSize");
    const colorEl = document.getElementById("adminFormOptColor");
    const materialEl = document.getElementById("adminFormOptMaterial");
    const mockupsEl = document.getElementById("adminFormMockups");
    const canvasEl = document.getElementById("adminFormCanvasMode");
    const pubEl = document.getElementById("adminFormPublished");
    const tplEl = document.getElementById("adminFormTemplateLinks");
    const detailEditor = document.getElementById("adminFormDetailEditor");
    const detailToolbar = document.getElementById("adminFormDetailToolbar");
    const detailClearBtn = document.getElementById("adminFormDetailClearBtn");
    const detailAdvancedBtn = document.getElementById("adminFormDetailAdvancedBtn");
    const detailPreview = document.getElementById("adminFormDetailPreview");
    const detailTabEdit = document.getElementById("adminFormDetailTabEdit");
    const detailTabPreview = document.getElementById("adminFormDetailTabPreview");
    const saveBtn = document.getElementById("adminFormSaveBtn");
    const delBtn = document.getElementById("adminFormDeleteBtn");
    if (!idEl || !nameEl || !descEl || !catEl || !subcatEl || !priceEl || !tagsEl || !sizeEl || !colorEl || !materialEl || !mockupsEl || !canvasEl || !pubEl || !tplEl || !detailEditor || !detailToolbar || !detailClearBtn || !detailAdvancedBtn || !detailPreview || !detailTabEdit || !detailTabPreview || !saveBtn || !delBtn) return;

    const editingId = routeKey === "/admin/products/:id/edit" ? String(params.id || "").trim() : "";
    const catalog = getCatalogProducts();
    const current = editingId ? (catalog.find((p) => p.id === editingId) || null) : null;

    const templateRows = loadEditorTemplates();
    tplEl.innerHTML = templateRows
      .map((tpl) => `<option value="${esc(tpl.id)}">${esc(tpl.name)} [${esc(tpl.pageName)}] (${esc(tpl.id)})</option>`)
      .join("");
    const linked = new Set(current ? getLinkedTemplateIds(current.id) : []);
    Array.from(tplEl.options).forEach((opt) => {
      opt.selected = linked.has(opt.value);
    });

    idEl.disabled = !!current;
    idEl.value = current?.id || "";
    nameEl.value = current?.name || "";
    descEl.value = current?.description || "";
    const currentCategory = normalizeStoreCategory(current?.category || STORE_CATEGORIES[0]);
    const hasCategoryOption = Array.from(catEl.options).some((opt) => opt.value === currentCategory);
    if (!hasCategoryOption && currentCategory) {
      const opt = document.createElement("option");
      opt.value = currentCategory;
      opt.textContent = currentCategory;
      catEl.appendChild(opt);
    }
    catEl.value = currentCategory || STORE_CATEGORIES[0];
    if (!catEl.value && STORE_CATEGORIES.length) {
      catEl.value = STORE_CATEGORIES[0];
    }
    const syncSubcategoryOptions = (preferredRaw) => {
      const preferred = String(preferredRaw || subcatEl.value || "").trim();
      const categoryName = normalizeStoreCategory(catEl.value);
      const types = getCategorySampleTypes(categoryName);
      const hasPreferred = preferred && types.includes(preferred);
      subcatEl.innerHTML = `<option value="">선택 안함</option>${types.map((name) => `<option value="${esc(name)}">${esc(name)}</option>`).join("")}`;
      if (preferred && !hasPreferred) {
        const extra = document.createElement("option");
        extra.value = preferred;
        extra.textContent = `${preferred} (저장값)`;
        subcatEl.appendChild(extra);
      }
      subcatEl.value = preferred || "";
    };
    syncSubcategoryOptions(current?.subcategory || "");
    if (!catEl.dataset.subcategoryBound) {
      catEl.dataset.subcategoryBound = "1";
      catEl.addEventListener("change", () => {
        syncSubcategoryOptions("");
      });
    }
    priceEl.value = String(current?.basePrice ?? 0);
    tagsEl.value = (current?.tags || []).join(", ");
    const optionSeed = current?.options || DEFAULT_OPTIONS;
    sizeEl.value = (optionSeed.size || []).map((x) => `${x.value}:${x.delta >= 0 ? "+" : ""}${x.delta}`).join(", ");
    colorEl.value = (optionSeed.color || []).map((x) => `${x.value}:${x.delta >= 0 ? "+" : ""}${x.delta}`).join(", ");
    materialEl.value = (optionSeed.material || []).map((x) => `${x.value}:${x.delta >= 0 ? "+" : ""}${x.delta}`).join(", ");
    mockupsEl.value = (current?.mockups || []).join(", ");
    canvasEl.value = current?.canvasMode || "fit";
    pubEl.value = current?.isPublished === false ? "false" : "true";
    const currentMeta = current ? normalizeMeta(state.productMeta[current.id], PRODUCT_META_DEFAULT[current.id] || SEED_BY_ID[current.id] || {}) : null;
    detailEditor.innerHTML = currentMeta?.detailContent ? sanitizeDetailHtml(currentMeta.detailContent) : `<p>${esc(current?.description || "")}</p>`;
    detailEditor.hidden = false;
    detailEditor.contentEditable = "true";
    detailPreview.hidden = true;
    detailTabEdit.classList.add("active");
    detailTabPreview.classList.remove("active");
    const renderPreview = () => {
      const html = sanitizeDetailHtml(detailEditor.innerHTML);
      detailPreview.innerHTML = html || "<p>미리보기 내용이 없습니다.</p>";
    };
    renderPreview();
    delBtn.style.display = current ? "inline-flex" : "none";

    if (!detailToolbar.dataset.bound) {
      detailToolbar.dataset.bound = "1";
      detailToolbar.addEventListener("click", (e) => {
        const tplBtn = e.target.closest("[data-editor-template]");
        if (tplBtn) {
          const templateKey = String(tplBtn.getAttribute("data-editor-template") || "").trim();
          const blocks = {
            shipping: `<h3>배송 안내</h3><ul><li>평균 출고: 결제 완료 후 2~4영업일</li><li>주문 제작 상품 특성상 제작 시작 후 단순 변심 취소가 제한될 수 있습니다.</li></ul>`,
            production: `<h3>제작 안내</h3><ul><li>업로드한 이미지 해상도에 따라 최종 인쇄 품질이 달라질 수 있습니다.</li><li>컬러는 모니터 환경에 따라 실제 인쇄물과 차이가 발생할 수 있습니다.</li></ul>`,
            notice: `<h3>주의사항</h3><ul><li>텍스트/이미지는 안전영역 안에 배치해 주세요.</li><li>저작권이 없는 이미지/문구만 사용해 주세요.</li></ul>`
          };
          const html = blocks[templateKey] || "";
          if (!html) return;
          detailEditor.focus();
          document.execCommand("insertHTML", false, html);
          renderPreview();
          return;
        }
        const btn = e.target.closest("[data-editor-cmd]");
        if (!btn) return;
        const cmd = String(btn.getAttribute("data-editor-cmd") || "").trim();
        const value = String(btn.getAttribute("data-editor-value") || "").trim();
        detailEditor.focus();
        if (cmd === "createLink") {
          const url = window.prompt("링크 URL을 입력하세요", "https://");
          if (!url) return;
          document.execCommand("createLink", false, url);
          return;
        }
        if (cmd === "insertImage") {
          const url = window.prompt("이미지 URL을 입력하세요", "https://");
          if (!url) return;
          document.execCommand("insertImage", false, url);
          return;
        }
        if (cmd === "formatBlock") {
          document.execCommand("formatBlock", false, value || "P");
          renderPreview();
          return;
        }
        document.execCommand(cmd, false, value || null);
        renderPreview();
      });
    }
    if (!detailClearBtn.dataset.bound) {
      detailClearBtn.dataset.bound = "1";
      detailClearBtn.addEventListener("click", () => {
        const ok = window.confirm("상세페이지 에디터 내용을 초기화할까요?");
        if (!ok) return;
        detailEditor.innerHTML = "<p></p>";
        renderPreview();
      });
    }
    if (!detailAdvancedBtn.dataset.bound) {
      detailAdvancedBtn.dataset.bound = "1";
      detailAdvancedBtn.addEventListener("click", () => {
        const sessionId = uid("detail_popup");
        const draftScope = String(idEl.value || editingId || "new_product").trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "new_product";
        const draftKey = `lf.detailEditorDraft.v1.${draftScope}`;
        const popup = window.open("", `lf_detail_editor_${Date.now()}`, "width=1440,height=920,resizable=yes,scrollbars=yes");
        if (!popup) {
          alert("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해 주세요.");
          return;
        }
        const onMessage = (event) => {
          if (event.source !== popup) return;
          const data = event.data || {};
          if (!data || data.sessionId !== sessionId) return;
          if (data.type === "LF_DETAIL_EDITOR_READY") {
            popup.postMessage({ type: "LF_DETAIL_EDITOR_INIT", sessionId, html: detailEditor.innerHTML || "<p></p>" }, "*");
            return;
          }
          if (data.type === "LF_DETAIL_EDITOR_APPLY") {
            const safe = sanitizeDetailHtml(String(data.html || ""));
            detailEditor.innerHTML = safe || "<p></p>";
            renderPreview();
            if (data.close === true && !popup.closed) popup.close();
          }
        };
        window.addEventListener("message", onMessage);
        const timer = window.setInterval(() => {
          if (popup.closed) {
            window.clearInterval(timer);
            window.removeEventListener("message", onMessage);
          }
        }, 700);
        popup.document.open();
        popup.document.write(buildDetailEditorPopupHtml(sessionId, draftKey));
        popup.document.close();
      });
    }
    if (!detailEditor.dataset.previewBound) {
      detailEditor.dataset.previewBound = "1";
      detailEditor.addEventListener("input", renderPreview);
    }
    if (!detailTabEdit.dataset.bound) {
      detailTabEdit.dataset.bound = "1";
      detailTabEdit.addEventListener("click", () => {
        detailEditor.hidden = false;
        detailEditor.contentEditable = "true";
        detailPreview.hidden = true;
        detailTabEdit.classList.add("active");
        detailTabPreview.classList.remove("active");
      });
    }
    if (!detailTabPreview.dataset.bound) {
      detailTabPreview.dataset.bound = "1";
      detailTabPreview.addEventListener("click", () => {
        renderPreview();
        detailEditor.hidden = true;
        detailEditor.contentEditable = "false";
        detailPreview.hidden = false;
        detailTabEdit.classList.remove("active");
        detailTabPreview.classList.add("active");
      });
    }

    if (!saveBtn.dataset.bound) {
      saveBtn.dataset.bound = "1";
      saveBtn.addEventListener("click", () => {
        const nextId = String(idEl.value || "").trim();
        const nextName = String(nameEl.value || "").trim();
        if (!nextId || !nextName) {
          alert("상품 ID와 상품명은 필수입니다.");
          return;
        }

        const editorProducts = loadEditorProducts();
        const exists = editorProducts.find((p) => p.id === nextId);
        const canvasMode = canvasEl.value === "compact" || canvasEl.value === "focus" ? canvasEl.value : "fit";
        const nextProduct = {
          id: nextId,
          name: nextName,
          canvasMode,
          category: normalizeStoreCategory(catEl.value),
          basePrice: Math.max(0, Number(priceEl.value || 0)),
          isPublished: pubEl.value !== "false"
        };
        const mergedProducts = exists
          ? editorProducts.map((p) => (p.id === nextId ? nextProduct : p))
          : editorProducts.concat(nextProduct);
        saveEditorProducts(mergedProducts);
        state.allProductsDeleted = false;
        saveJson(STORE_KEYS.allProductsDeleted, false);

        const seed = PRODUCT_META_DEFAULT[nextId] || {};
        const prevMeta = state.productMeta[nextId] || {};
        const fallbackOptions = normalizeMeta(prevMeta, seed).options || DEFAULT_OPTIONS;
        const detailContent = sanitizeDetailHtml(detailEditor.innerHTML);
        state.productMeta[nextId] = {
          ...normalizeMeta(prevMeta, seed),
          category: normalizeStoreCategory(catEl.value),
          subcategory: String(subcatEl.value || "").trim(),
          basePrice: Math.max(0, Number(priceEl.value || 0)),
          tags: splitCsv(tagsEl.value),
          mockups: splitCsv(mockupsEl.value),
          description: String(descEl.value || "").trim(),
          detailContent,
          options: {
            size: parseOptionLine(sizeEl.value, fallbackOptions.size),
            color: parseOptionLine(colorEl.value, fallbackOptions.color),
            material: parseOptionLine(materialEl.value, fallbackOptions.material)
          },
          isPublished: pubEl.value !== "false"
        };
        saveJson(STORE_KEYS.productMeta, state.productMeta);

        const selectedTemplateIds = new Set(Array.from(tplEl.selectedOptions).map((opt) => opt.value));
        const templates = loadEditorTemplates();
        const previous = new Set(templates.filter((tpl) => tpl.productId === nextId).map((tpl) => tpl.id));
        const fallbackProduct = mergedProducts.find((p) => p.id !== nextId)?.id || "default_product";
        templates.forEach((tpl) => {
          if (selectedTemplateIds.has(tpl.id)) {
            tpl.productId = nextId;
          } else if (previous.has(tpl.id) && tpl.productId === nextId) {
            tpl.productId = fallbackProduct;
          }
        });
        saveEditorTemplates(templates);

        window.dispatchEvent(new CustomEvent("lf:catalog-updated", { detail: { source: "router" } }));
        renderAdminProducts();
        renderProductsPage();
        alert("상품과 템플릿 연결이 저장되었습니다.");
        location.hash = "#/admin/products";
      });
    }

    if (!delBtn.dataset.bound) {
      delBtn.dataset.bound = "1";
      delBtn.addEventListener("click", () => {
        const targetId = String(idEl.value || "").trim();
        if (!targetId) return;
        const ok = confirm(`상품 '${targetId}'를 삭제할까요? 연결 템플릿은 다른 상품으로 이동됩니다.`);
        if (!ok) return;

        const editorProducts = loadEditorProducts().filter((p) => p.id !== targetId);
        const nextProducts = editorProducts.length ? editorProducts : [{
          id: "default_product",
          name: "기본 상품",
          canvasMode: "fit",
          category: STORE_CATEGORIES[0],
          basePrice: 0,
          isPublished: true
        }];
        saveEditorProducts(nextProducts);

        delete state.productMeta[targetId];
        saveJson(STORE_KEYS.productMeta, state.productMeta);

        const fallbackProduct = nextProducts[0].id;
        const templates = loadEditorTemplates();
        templates.forEach((tpl) => {
          if (tpl.productId === targetId) tpl.productId = fallbackProduct;
        });
        saveEditorTemplates(templates);

        window.dispatchEvent(new CustomEvent("lf:catalog-updated", { detail: { source: "router" } }));
        renderAdminProducts();
        renderProductsPage();
        alert("상품이 삭제되었습니다.");
        location.hash = "#/admin/products";
      });
    }
  }

  function renderAdminInbox() {
    const tbody = document.getElementById("adminInboxBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    state.submissions.forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(s.createdAt).toLocaleString()}</td>
        <td>${s.productName}</td>
        <td>${s.customerInfo.name}</td>
        <td><span class="statusChip">${s.status}</span></td>
        <td><a class="btn2" href="#/admin/inbox/${s.id}">Detail</a></td>
      `;
      tbody.appendChild(tr);
    });
    if (!state.submissions.length) {
      tbody.innerHTML = `<tr><td colspan="5">접수된 요청이 없습니다.</td></tr>`;
    }
  }

  function renderSubmissionDetail(submissionId) {
    const submission = state.submissions.find((x) => x.id === submissionId);
    const meta = document.getElementById("submissionDetailMeta");
    const box = document.getElementById("submissionPreviewBox");
    const status = document.getElementById("submissionStatusSelect");
    const note = document.getElementById("submissionInternalNote");
    const saveBtn = document.getElementById("saveSubmissionStatusBtn");
    const dlProd = document.getElementById("dlProductionBtn");
    const dlPrev = document.getElementById("dlPreviewBtn");
    const dlSpec = document.getElementById("dlSpecBtn");
    if (!meta || !box || !status || !note || !saveBtn || !dlProd || !dlPrev || !dlSpec) return;

    if (!submission) {
      meta.textContent = "제출 정보를 찾을 수 없습니다.";
      box.textContent = "No data";
      return;
    }

    meta.innerHTML = `
      요청ID: ${submission.id}<br/>
      상품: ${submission.productName}<br/>
      옵션: ${submission.optionsLabel}<br/>
      고객: ${submission.customerInfo.name} / ${submission.customerInfo.email} / ${submission.customerInfo.phone}<br/>
      가격: ${won(submission.price.total)}
    `;
    box.textContent = `${submission.productName} Preview (${submission.assets.preview?.filename || "-"})`;
    status.value = submission.status;
    note.value = submission.internalNote || "";

    function bindDownload(btn, assetMeta) {
      btn.onclick = () => {
        if (!assetMeta?.runtimeKey || !runtimeAssetStore.has(assetMeta.runtimeKey)) {
          alert("런타임 파일이 없어 다운로드할 수 없습니다. 다시 제출된 최신 요청에서 시도하세요.");
          return;
        }
        const file = runtimeAssetStore.get(assetMeta.runtimeKey);
        const url = URL.createObjectURL(file.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      };
    }

    bindDownload(dlProd, submission.assets.production);
    bindDownload(dlPrev, submission.assets.preview);
    bindDownload(dlSpec, submission.assets.spec);

    saveBtn.onclick = async () => {
      submission.status = status.value;
      submission.internalNote = note.value || "";
      saveJson(STORE_KEYS.submissions, state.submissions);
      renderAdminInbox();
      renderAdminStorePulse();
      renderMySubmissions();
      try {
        if (window.MockupApi?.updateSubmissionStatus) {
          await window.MockupApi.updateSubmissionStatus(submission.id, {
            status: submission.status,
            internalNote: submission.internalNote
          });
        }
      } catch {
        // local first
      }
      alert("상태가 저장되었습니다.");
    };
  }

  async function submitFromEditor() {
    const bridge = window.EditorBridge;
    if (!bridge) {
      alert("에디터 브리지를 찾을 수 없습니다.");
      return;
    }
    const validation = bridge.validate();
    if (validation.errors?.length) {
      alert("제출 불가 항목:\n" + validation.errors.join("\n"));
      return;
    }
    if (validation.warnings?.length) {
      const go = confirm("경고가 있습니다. 계속 제출할까요?\n" + validation.warnings.join("\n"));
      if (!go) return;
    }

    const ctx = bridge.getCurrentContext();
    const product = getProduct(ctx.productId);
    const selection = getSelection(product.id);
    const price = calcPrice(product, selection);
    const files = await bridge.exportBundle();
    const note = ctx.note || "";
    let productionPipeline = null;
    try {
      if (window.MockupApi?.exportProduction) {
        productionPipeline = await window.MockupApi.exportProduction(files.spec.spec);
      }
    } catch {
      productionPipeline = null;
    }

    const payload = {
      productId: product.id,
      productName: product.name,
      selectedOptions: {
        size: selection.size.value,
        color: selection.color.value,
        material: selection.material.value
      },
      price,
      customerInfo: { name: "웹 사용자", email: "-", phone: "-" },
      notes: note,
      editorContext: ctx,
      productionPipeline
    };

    let serverResult = null;
    try {
      if (window.MockupApi?.submitSubmission) {
        serverResult = await window.MockupApi.submitSubmission(payload, files);
      }
    } catch {
      // local fallback below
    }

    const id = serverResult?.id || uid("SUB");
    const submission = {
      id,
      productId: product.id,
      productName: product.name,
      selectedOptions: payload.selectedOptions,
      optionsLabel: `${payload.selectedOptions.size} / ${payload.selectedOptions.color} / ${payload.selectedOptions.material}`,
      customerInfo: payload.customerInfo,
      notes: payload.notes,
      status: "Received",
      internalNote: "",
      createdAt: new Date().toISOString(),
      price,
      assets: {
        spec: { filename: files.spec.filename, runtimeKey: uid("asset_spec") },
        preview: { filename: files.preview.filename, runtimeKey: uid("asset_preview") },
        production: { filename: files.print.filename, runtimeKey: uid("asset_print") }
      }
    };
    runtimeAssetStore.set(submission.assets.spec.runtimeKey, { blob: files.spec.blob, filename: files.spec.filename });
    runtimeAssetStore.set(submission.assets.preview.runtimeKey, { blob: files.preview.blob, filename: files.preview.filename });
    runtimeAssetStore.set(submission.assets.production.runtimeKey, { blob: files.print.blob, filename: files.print.filename });

    state.submissions.unshift(submission);
    saveJson(STORE_KEYS.submissions, state.submissions);
    renderMySubmissions();
    renderAdminInbox();
    renderAdminStorePulse();
    alert(`제출 완료: ${id}`);
    location.hash = "#/my-submissions";
  }

  function refreshTemplateEditorProductOptions() {
    const productSel = document.getElementById("tplEditorProduct");
    if (!productSel) return;
    const current = productSel.value;
    const catalog = getCatalogProducts();
    productSel.innerHTML = catalog.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("");
    if (catalog.some((p) => p.id === current)) {
      productSel.value = current;
    } else if (catalog[0]) {
      productSel.value = catalog[0].id;
    }
  }

  function initTemplateEditor() {
    const productSel = document.getElementById("tplEditorProduct");
    const viewInput = document.getElementById("tplEditorViewName");
    const xInput = document.getElementById("tplX");
    const yInput = document.getElementById("tplY");
    const wInput = document.getElementById("tplW");
    const hInput = document.getElementById("tplH");
    const outputInput = document.getElementById("tplOutput");
    const safeBleedInput = document.getElementById("tplSafeBleed");
    const maskInput = document.getElementById("tplMask");
    const stage = document.getElementById("tplStage");
    const rect = document.getElementById("tplRect");
    const handle = document.getElementById("tplHandle");
    const applyBtn = document.getElementById("tplApplyInputsBtn");
    const saveBtn = document.getElementById("tplSaveBtn");
    if (!productSel || !viewInput || !xInput || !yInput || !wInput || !hInput || !stage || !rect || !handle || !applyBtn || !saveBtn) return;

    refreshTemplateEditorProductOptions();
    if (!viewInput.value) viewInput.value = "Front";

    function key() {
      return `${productSel.value}:${viewInput.value.trim() || "Front"}`;
    }

    function toPercent(px, total) {
      if (!total) return 0;
      return Math.max(0, Math.min(100, (px / total) * 100));
    }

    function applyInputsToRect() {
      const x = Math.max(0, Math.min(100, Number(xInput.value || 0)));
      const y = Math.max(0, Math.min(100, Number(yInput.value || 0)));
      const w = Math.max(1, Math.min(100, Number(wInput.value || 1)));
      const h = Math.max(1, Math.min(100, Number(hInput.value || 1)));
      rect.style.left = `${x}%`;
      rect.style.top = `${y}%`;
      rect.style.width = `${w}%`;
      rect.style.height = `${h}%`;
    }

    function syncInputsFromRect() {
      const s = stage.getBoundingClientRect();
      const r = rect.getBoundingClientRect();
      xInput.value = toPercent(r.left - s.left, s.width).toFixed(1);
      yInput.value = toPercent(r.top - s.top, s.height).toFixed(1);
      wInput.value = toPercent(r.width, s.width).toFixed(1);
      hInput.value = toPercent(r.height, s.height).toFixed(1);
    }

    function loadDraft() {
      const draft = state.templateEditor[key()];
      if (!draft) {
        xInput.value = "20";
        yInput.value = "20";
        wInput.value = "60";
        hInput.value = "60";
        outputInput.value = "30cm x 40cm @ 300DPI";
        safeBleedInput.value = "safe: 8mm, bleed: 3mm";
        maskInput.value = "";
        applyInputsToRect();
        return;
      }
      xInput.value = String(draft.printArea.xPct);
      yInput.value = String(draft.printArea.yPct);
      wInput.value = String(draft.printArea.wPct);
      hInput.value = String(draft.printArea.hPct);
      outputInput.value = draft.outputSize || "";
      safeBleedInput.value = draft.safeBleed || "";
      maskInput.value = draft.mask || "";
      applyInputsToRect();
    }

    function saveDraft() {
      state.templateEditor[key()] = {
        productId: productSel.value,
        viewName: viewInput.value.trim() || "Front",
        printArea: {
          xPct: Number(xInput.value || 0),
          yPct: Number(yInput.value || 0),
          wPct: Number(wInput.value || 0),
          hPct: Number(hInput.value || 0)
        },
        outputSize: outputInput.value || "",
        safeBleed: safeBleedInput.value || "",
        mask: maskInput.value || ""
      };
      saveJson(STORE_KEYS.templateEditor, state.templateEditor);
    }

    applyBtn.addEventListener("click", applyInputsToRect);
    saveBtn.addEventListener("click", async () => {
      saveDraft();
      try {
        if (window.MockupApi?.saveTemplateConfig) {
          await window.MockupApi.saveTemplateConfig(state.templateEditor[key()]);
        }
      } catch {
        // local first
      }
      alert("템플릿 설정이 저장되었습니다.");
    });
    productSel.addEventListener("change", loadDraft);
    viewInput.addEventListener("change", loadDraft);
    [xInput, yInput, wInput, hInput].forEach((el) => el.addEventListener("input", applyInputsToRect));

    let dragMode = null;
    let start = null;
    function getPoint(e) {
      const p = e.touches?.[0] || e;
      return { x: p.clientX, y: p.clientY };
    }
    rect.addEventListener("pointerdown", (e) => {
      if (e.target === handle) return;
      dragMode = "move";
      start = { ...getPoint(e), left: rect.offsetLeft, top: rect.offsetTop };
      rect.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointerdown", (e) => {
      dragMode = "resize";
      start = { ...getPoint(e), width: rect.offsetWidth, height: rect.offsetHeight };
      handle.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });
    function onMove(e) {
      if (!dragMode || !start) return;
      const p = getPoint(e);
      const dx = p.x - start.x;
      const dy = p.y - start.y;
      if (dragMode === "move") {
        const maxL = stage.clientWidth - rect.offsetWidth;
        const maxT = stage.clientHeight - rect.offsetHeight;
        rect.style.left = `${Math.max(0, Math.min(maxL, start.left + dx))}px`;
        rect.style.top = `${Math.max(0, Math.min(maxT, start.top + dy))}px`;
      } else {
        const min = 30;
        rect.style.width = `${Math.max(min, start.width + dx)}px`;
        rect.style.height = `${Math.max(min, start.height + dy)}px`;
      }
      syncInputsFromRect();
    }
    function onUp() {
      if (!dragMode) return;
      dragMode = null;
      start = null;
      saveDraft();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    loadDraft();
  }

  function initAdminSectionFilters() {
    const groups = [
      { barId: "adminProductsFilter", pageId: "page-admin-products" },
      { barId: "adminTemplatesFilter", pageId: "page-admin-templates" }
    ];

    groups.forEach(({ barId, pageId }) => {
      const bar = document.getElementById(barId);
      const page = document.getElementById(pageId);
      if (!bar || !page || bar.dataset.bound === "1") return;
      const buttons = Array.from(bar.querySelectorAll("[data-admin-filter]"));
      if (!buttons.length) return;

      const applyFilter = (filter) => {
        buttons.forEach((btn) => btn.classList.toggle("active", btn.dataset.adminFilter === filter));
        page.querySelectorAll("[data-admin-block]").forEach((block) => {
          if (block.dataset.adminHidden === "1") {
            block.style.display = "none";
            return;
          }
          const key = block.getAttribute("data-admin-block");
          const visible = filter === "all" || key === filter;
          block.style.display = visible ? "" : "none";
        });
        bar.dataset.current = filter;
        state.adminFilters[barId] = filter;
        saveJson(STORE_KEYS.adminFilters, state.adminFilters);
      };

      buttons.forEach((btn) => {
        btn.addEventListener("click", () => applyFilter(btn.dataset.adminFilter || "all"));
      });
      bar.dataset.bound = "1";
      const savedFilter = state.adminFilters[barId];
      const valid = buttons.some((btn) => btn.dataset.adminFilter === savedFilter);
      applyFilter(valid ? savedFilter : (bar.dataset.current || "all"));
    });
  }

  function initAdminAccordions() {
    const adminPageIds = [
      "page-admin-products",
      "page-admin-product-form",
      "page-admin-templates",
      "page-admin-options",
      "page-admin-inbox",
      "page-admin-submission-detail"
    ];
    adminPageIds.forEach((pageId) => {
      const page = document.getElementById(pageId);
      if (!page) return;
      const sections = Array.from(page.querySelectorAll(".section"));
      sections.forEach((section, index) => {
        if (section.dataset.noAccordion === "1") return;
        const accKey = `${pageId}:${section.dataset.adminBlock || section.id || index}`;
        if (section.dataset.accordionBound !== "1") {
          let title = "";
          const first = section.firstElementChild;
          if (first && first.matches("label,h2,h3")) {
            title = String(first.textContent || "").trim();
            first.remove();
          }
          if (!title) {
            title = section.dataset.adminTitle || `섹션 ${index + 1}`;
          }
          section.classList.add("adminAccordion");
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.className = "adminAccordionToggle";
          toggle.innerHTML = `<span class="adminAccordionTitle">${title}</span><span class="adminAccordionChevron" aria-hidden="true">⌄</span>`;

          const body = document.createElement("div");
          body.className = "adminAccordionBody";
          while (section.firstChild) body.appendChild(section.firstChild);
          section.appendChild(toggle);
          section.appendChild(body);

          const setOpen = (open) => {
            section.classList.toggle("is-collapsed", !open);
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
            state.adminAccordions[accKey] = open;
            saveJson(STORE_KEYS.adminAccordions, state.adminAccordions);
          };
          const saved = state.adminAccordions[accKey];
          setOpen(saved !== false);
          toggle.addEventListener("click", () => {
            const open = toggle.getAttribute("aria-expanded") === "true";
            setOpen(!open);
          });
          section.dataset.accordionBound = "1";
        } else {
          const toggle = section.querySelector(".adminAccordionToggle");
          if (!toggle) return;
          const open = state.adminAccordions[accKey] !== false;
          section.classList.toggle("is-collapsed", !open);
          toggle.setAttribute("aria-expanded", open ? "true" : "false");
        }
      });
    });
  }

  function route() {
    const r = parseRoute();
    state.currentRoute = r.key;
    state.currentParams = r.params;
    const catalog = getCatalogProducts();

    pages.forEach((p) => {
      p.hidden = p.id !== r.pageId;
    });
    initTopCategoryNav();
    activateRouteNav(r.key);
    syncTopCategoryNav();
    const isAdminRoute = r.key.startsWith("/admin");
    applyUiTheme();
    applyButtonTheme();
    applyFontTheme();
    if (isAdminRoute) applyAdminThemeUi();
    else if (document.body) document.body.removeAttribute("data-admin-ui-theme");
    const adminThemeSwitch = document.getElementById("adminThemeSwitch");
    if (adminThemeSwitch) {
      const showThemeSwitch = isAdminRoute && r.key !== "/admin/login";
      adminThemeSwitch.hidden = !showThemeSwitch;
      adminThemeSwitch.style.display = showThemeSwitch ? "" : "none";
    }

    if (r.key === "/") renderHomeExperience();
    if (r.key === "/products") renderProductsPage();
    if (r.key === "/products/category/:categorySlug") renderProductsCategoryPage(slugToCategory(r.params.categorySlug));
    if (r.key === "/products/:id") {
      const hasProduct = catalog.some((p) => p.id === r.params.id && p.isPublished !== false);
      if (!hasProduct && catalog[0]?.id) location.hash = `#/products/${catalog[0].id}`;
      else renderProductDetail(r.params.id);
    }
    if (r.key === "/editor/:productId") {
      const hasProduct = catalog.some((p) => p.id === r.params.productId);
      if (!hasProduct && catalog[0]?.id) {
        location.hash = `#/editor/${catalog[0].id}`;
      } else {
        syncEditorProduct(r.params.productId);
      }
    }
    if (r.key === "/admin/products") renderAdminProducts();
    if (r.key === "/admin/products") renderAdminStorePulse();
    if (r.key === "/admin/products") renderAdminCategoryOrder();
    if (r.key === "/admin/products") renderAdminSubtypeSettings();
    if (r.key === "/admin/products/new" || r.key === "/admin/products/:id/edit") {
      renderAdminProductForm(r.key, r.params);
    }
    if (r.key === "/admin/templates") refreshTemplateEditorProductOptions();
    if (r.key === "/admin/inbox/:submissionId") renderSubmissionDetail(r.params.submissionId);
    if (isAdminRoute) initAdminAccordions();

    const formTitle = document.getElementById("adminProductFormTitle");
    if (formTitle) {
      formTitle.textContent = r.key === "/admin/products/:id/edit" ? `Admin Product Edit (${r.params.id})` : "Admin Product Form";
    }
  }

  function init() {
    initTopCategoryNav();
    ensureCategorySampleProductsInStore();
    renderHomeExperience();
    renderProductsPage();
    renderMySubmissions();
    renderAdminProducts();
    renderAdminStorePulse();
    renderAdminCategoryOrder();
    renderAdminSubtypeSettings();
    renderAdminInbox();
    const exportBtn = document.getElementById("export");
    if (exportBtn && !exportBtn.dataset.submitBound) {
      exportBtn.dataset.submitBound = "1";
      exportBtn.addEventListener("click", () => {
        submitFromEditor().catch((err) => alert(`제출 실패: ${err.message || err}`));
      });
    }
    initTemplateEditor();
    initAdminThemeSwitch();
    initAdminSectionFilters();
    const finalizeBtn = document.getElementById("adminFinalizeApplyBtn");
    if (finalizeBtn && !finalizeBtn.dataset.bound) {
      finalizeBtn.dataset.bound = "1";
      finalizeBtn.addEventListener("click", () => {
        initTopCategoryNav();
        syncTopCategoryNav();
        renderHomeExperience();
        renderProductsPage();
        renderAdminProducts();
        renderAdminStorePulse();
        renderAdminCategoryOrder();
        renderAdminSubtypeSettings();
        window.dispatchEvent(new CustomEvent("lf:catalog-updated", { detail: { source: "router" } }));
        location.hash = "#/";
      });
    }
    const deleteSelectedBtn = document.getElementById("adminDeleteSelectedProductsBtn");
    if (deleteSelectedBtn && !deleteSelectedBtn.dataset.bound) {
      deleteSelectedBtn.dataset.bound = "1";
      deleteSelectedBtn.addEventListener("click", () => {
        const checked = Array.from(document.querySelectorAll("#adminProductsByCategory [data-admin-product-check]:checked"));
        const targetIds = [...new Set(checked.map((el) => String(el.getAttribute("data-admin-product-check") || "").trim()).filter(Boolean))];
        if (!targetIds.length) {
          alert("삭제할 상품을 체크하세요.");
          return;
        }
        const ok = window.confirm(`선택한 ${targetIds.length}개 상품을 삭제할까요?`);
        if (!ok) return;

        const targetSet = new Set(targetIds);
        const nextProducts = loadEditorProducts().filter((p) => !targetSet.has(p.id));
        saveEditorProducts(nextProducts);

        const nextMeta = { ...state.productMeta };
        targetIds.forEach((id) => { delete nextMeta[id]; });
        state.productMeta = nextMeta;
        saveJson(STORE_KEYS.productMeta, state.productMeta);

        const templates = loadEditorTemplates();
        const fallbackProduct = nextProducts[0]?.id || "";
        templates.forEach((tpl) => {
          if (targetSet.has(String(tpl.productId || ""))) tpl.productId = fallbackProduct;
        });
        saveEditorTemplates(templates);

        const makeTypes = loadJson("lf.product.makeTypes.v1", {});
        targetIds.forEach((id) => { delete makeTypes[id]; });
        localStorage.setItem("lf.product.makeTypes.v1", JSON.stringify(makeTypes));

        const defaultAssets = loadJson("lf.product.defaultAssets.v1", {});
        targetIds.forEach((id) => { delete defaultAssets[id]; });
        localStorage.setItem("lf.product.defaultAssets.v1", JSON.stringify(defaultAssets));

        const nextSelections = { ...state.selections };
        targetIds.forEach((id) => { delete nextSelections[id]; });
        state.selections = nextSelections;
        saveJson(STORE_KEYS.selections, state.selections);

        const nextQty = { ...state.quantities };
        targetIds.forEach((id) => { delete nextQty[id]; });
        state.quantities = nextQty;
        saveJson(STORE_KEYS.quantities, state.quantities);

        const noProducts = nextProducts.length === 0;
        if (noProducts) {
          localStorage.setItem(EDITOR_STORE_KEYS.productCategories, JSON.stringify([]));
          saveAdminCategoryOrder([]);
          saveDeletedCategories([]);
          state.categorySubtypes = {};
          saveJson(STORE_KEYS.categorySubtypes, state.categorySubtypes);
          state.productFilters = { category: "all" };
          saveJson(STORE_KEYS.productFilters, state.productFilters);
          state.allProductsDeleted = true;
          saveJson(STORE_KEYS.allProductsDeleted, true);
        } else {
          state.allProductsDeleted = false;
          saveJson(STORE_KEYS.allProductsDeleted, false);
        }

        initTopCategoryNav();
        syncTopCategoryNav();
        renderHomeExperience();
        renderProductsPage();
        renderAdminProducts();
        renderAdminStorePulse();
        renderAdminCategoryOrder();
        renderAdminSubtypeSettings();
        window.dispatchEvent(new CustomEvent("lf:catalog-updated", { detail: { source: "router" } }));
        alert(`선택한 ${targetIds.length}개 상품이 삭제되었습니다.`);
      });
    }
    initAdminAccordions();
    route();
  }

  window.addEventListener("lf:catalog-updated", () => {
    initTopCategoryNav();
    renderHomeExperience();
    renderProductsPage();
    renderAdminProducts();
    renderAdminStorePulse();
    renderAdminCategoryOrder();
    renderAdminSubtypeSettings();
    refreshTemplateEditorProductOptions();
    if (state.currentRoute === "/products/:id") renderProductDetail(state.currentParams.id);
  });
  window.addEventListener("hashchange", route);
  window.addEventListener("DOMContentLoaded", init);
})();
