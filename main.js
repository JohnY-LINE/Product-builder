// ===== Template / Asset Admin Store =====
const DEFAULT_TEMPLATE = {
  id: "strap_135x30",
  name: "스트랩키링 135×30mm",
  productId: "default_product",
  pageGroup: "default_product:default",
  pageName: "앞면",
  mm: { w: 135, h: 30 },
  bleed_mm: 5,
  safe_mm: 3,
  export: { dpi: 300 },
  templateImageUrl: "",
  templateImagePath: null,
  templateImageName: "",
  templateImageFit: "cover",
  bleedImageUrl: "",
  bleedImagePath: null,
  bleedImageName: "",
  safeImageUrl: "",
  safeImagePath: null,
  safeImageName: ""
};

const DEFAULT_PRODUCT = {
  id: "default_product",
  name: "기본 상품",
  canvasMode: "fit",
  category: "슬로건",
  basePrice: 0,
  isPublished: true
};

const STORE_KEYS = {
  products: "lf.products.v1",
  productMakeTypes: "lf.product.makeTypes.v1",
  productDefaultAssets: "lf.product.defaultAssets.v1",
  productCategories: "lf.product.categories.v1",
  templates: "lf.templates.v1",
  assets: "lf.assets.v1",
  supabase: "lf.supabase.v1",
  editorDraft: "lf.editorDraft.v1"
};
const CMS_DELETED_CATEGORIES_KEY = "cms.deletedCategories.v1";
const CMS_PRODUCT_META_KEY = "cms.productMeta.v1";
const CMS_ALL_PRODUCTS_DELETED_KEY = "cms.allProductsDeleted.v1";

const SB_TABLES = {
  products: "products",
  templates: "templates",
  assets: "assets"
};
const EDITOR_ADMIN_MODE_ENABLED = false;

const DEFAULT_SB_CONFIG = {
  url: "https://rdvvnnspothqtxwdobtp.supabase.co",
  anonKey: "sb_publishable_ZUdtCg1dNvzKcVXDxDG7Lw_0eDI_rHL",
  bucket: "editor-assets"
};

const DEFAULT_MAKE_TYPES = ["인쇄", "반사", "자수"];
const DEFAULT_STORE_CATEGORIES = ["슬로건", "우치와", "키링", "소품", "머그컵", "티셔츠", "특가상품"];
const MAX_EXPORT_PIXELS = 36000000; // 36MP safety cap for browser canvas memory
const MAX_EXPORT_EDGE = 12000; // keep below common browser canvas edge limits
const MIN_EXPORT_DPI = 72;
const PREVIEW_LONG_EDGE = 2400;
const IMAGE_FIT_VALUES = new Set(["cover", "contain", "fill", "real"]);
const HISTORY_LIMIT = 80;

const $ = (id) => document.getElementById(id);
function mmToPx(mm, dpi){ return Math.round(mm * dpi / 25.4); }
function uid(prefix){ return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2,8)}`; }
function normalizeEditorMode(mode){
  if(!EDITOR_ADMIN_MODE_ENABLED) return "user";
  return mode === "admin" ? "admin" : "user";
}
function safeJsonParse(raw, fallback){
  try { return JSON.parse(raw); } catch { return fallback; }
}
function sanitizeFileName(name){
  return (name || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function clamp(n, min, max){
  return Math.max(min, Math.min(max, n));
}

function notifyCatalogUpdated(){
  window.dispatchEvent(new Event("lf:catalog-updated"));
}

function normalizeImageFit(value){
  return IMAGE_FIT_VALUES.has(value) ? value : "cover";
}

function normalizeTemplatePageName(value){
  const s = String(value || "").trim();
  return s || "기본";
}

function normalizeTemplatePageGroup(value, productId){
  const s = String(value || "").trim();
  if(s) return s;
  return `${productId || DEFAULT_PRODUCT.id}:default`;
}

function toCanvasBlendMode(mode){
  if(!mode || mode === "normal") return "source-over";
  return mode;
}

function readFileAsDataUrl(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function validateTemplatePngFile(file, label){
  if(!file) return null;
  const isPngMime = file.type === "image/png" || file.type === "image/x-png" || file.type === "";
  const isPngName = /\.png$/i.test(file.name || "");
  if(!(isPngMime && isPngName)){
    alert(`${label}은(는) PNG 파일만 업로드 가능합니다.`);
    return "PNG 파일만 업로드 가능합니다.";
  }
  if(file.size > 15 * 1024 * 1024){
    alert(`${label}은(는) 15MB 이하로 업로드하세요.`);
    return "파일 크기 제한(15MB)을 초과했습니다.";
  }
  return null;
}

let supabaseClient = null;
let useSupabase = false;

function loadSbConfig(){
  return safeJsonParse(localStorage.getItem(STORE_KEYS.supabase), DEFAULT_SB_CONFIG) || DEFAULT_SB_CONFIG;
}

function saveSbConfig(cfg){
  localStorage.setItem(STORE_KEYS.supabase, JSON.stringify(cfg));
}

let sbConfig = loadSbConfig();
let sbLastError = "";

function setSbStatus(mode, ok){
  const el = $("sbStatus");
  el.textContent = mode;
  el.style.borderColor = ok ? "#0a6b2b" : "#a8a8a8";
  el.style.color = ok ? "#0a6b2b" : "#555";
  el.style.background = ok ? "#f4fff7" : "#fff";
}

function sleep(ms){
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseSbError(err, fallback){
  if(!err) return fallback;
  if(typeof err === "string") return err;

  const parts = [];
  if(err.message) parts.push(String(err.message));
  if(err.details) parts.push(String(err.details));
  if(err.hint) parts.push(String(err.hint));
  if(err.code) parts.push(`code=${err.code}`);
  if(err.status) parts.push(`status=${err.status}`);
  return parts.length ? parts.join(" | ") : fallback;
}

function getSbStatusText(){
  return useSupabase ? "SUPABASE" : "LOCAL";
}

function loadProductsLocal(){
  const saved = safeJsonParse(localStorage.getItem(STORE_KEYS.products), null);
  if(Array.isArray(saved) && saved.length){
    return saved
      .filter((p) => p && p.id && p.name)
      .map((p) => ({
        id: String(p.id),
        name: String(p.name),
        canvasMode: (p.canvasMode === "compact" || p.canvasMode === "focus") ? p.canvasMode : "fit",
        category: String(p.category || DEFAULT_PRODUCT.category),
        basePrice: Math.max(0, Number(p.basePrice || 0)),
        isPublished: p.isPublished !== false
      }));
  }
  if(isAllProductsDeleted()) return [];
  return [DEFAULT_PRODUCT];
}

function saveProductsLocal(items){
  localStorage.setItem(STORE_KEYS.products, JSON.stringify(items));
}

function normalizeMakeTypeList(input){
  return [...new Set((Array.isArray(input) ? input : [])
    .map((x) => String(x || "").trim())
    .filter(Boolean))]
    .slice(0, 12);
}

function loadProductMakeTypes(){
  const raw = safeJsonParse(localStorage.getItem(STORE_KEYS.productMakeTypes), {});
  if(!raw || typeof raw !== "object") return {};
  const out = {};
  Object.keys(raw).forEach((pid) => {
    out[pid] = normalizeMakeTypeList(raw[pid]);
  });
  return out;
}

function saveProductMakeTypes(map){
  localStorage.setItem(STORE_KEYS.productMakeTypes, JSON.stringify(map || {}));
}

function loadProductDefaultAssets(){
  const raw = safeJsonParse(localStorage.getItem(STORE_KEYS.productDefaultAssets), {});
  if(!raw || typeof raw !== "object") return {};
  const out = {};
  Object.keys(raw).forEach((pid) => {
    const aid = String(raw[pid] || "").trim();
    if(aid) out[pid] = aid;
  });
  return out;
}

function saveProductDefaultAssets(map){
  localStorage.setItem(STORE_KEYS.productDefaultAssets, JSON.stringify(map || {}));
}

function normalizeCategoryList(input){
  return [...new Set((Array.isArray(input) ? input : [])
    .map((x) => String(x || "").trim())
    .filter(Boolean))];
}

function loadCategorySubtypesMap(){
  const raw = safeJsonParse(localStorage.getItem("cms.categorySubtypes.v1"), {});
  return raw && typeof raw === "object" ? raw : {};
}

function getSubtypesForCategory(categoryName){
  const key = String(categoryName || "").trim();
  const map = loadCategorySubtypesMap();
  const list = Array.isArray(map[key]) ? map[key] : [];
  return normalizeCategoryList(list);
}

function loadCmsProductMetaMap(){
  const raw = safeJsonParse(localStorage.getItem(CMS_PRODUCT_META_KEY), {});
  return raw && typeof raw === "object" ? raw : {};
}

function saveCmsProductMetaMap(map){
  localStorage.setItem(CMS_PRODUCT_META_KEY, JSON.stringify(map && typeof map === "object" ? map : {}));
}

function isAllProductsDeleted(){
  return safeJsonParse(localStorage.getItem(CMS_ALL_PRODUCTS_DELETED_KEY), false) === true;
}

function loadProductCategories(){
  const raw = safeJsonParse(localStorage.getItem(STORE_KEYS.productCategories), []);
  return normalizeCategoryList(Array.isArray(raw) ? raw : []);
}

function saveProductCategories(items){
  localStorage.setItem(STORE_KEYS.productCategories, JSON.stringify(normalizeCategoryList(items)));
}

function loadTemplatesLocal(){
  const saved = safeJsonParse(localStorage.getItem(STORE_KEYS.templates), null);
  if(Array.isArray(saved) && saved.length){
    return saved
      .filter((tpl) => tpl && tpl.id && tpl.name && tpl.mm && tpl.export)
      .map((tpl) => ({
        id: tpl.id,
        name: tpl.name,
        productId: tpl.productId || DEFAULT_PRODUCT.id,
        pageGroup: normalizeTemplatePageGroup(tpl.pageGroup, tpl.productId || DEFAULT_PRODUCT.id),
        pageName: normalizeTemplatePageName(tpl.pageName),
        mm: { w: Number(tpl.mm.w), h: Number(tpl.mm.h) },
        bleed_mm: Number(tpl.bleed_mm),
        safe_mm: Number(tpl.safe_mm),
        export: { dpi: Number(tpl.export.dpi) },
        templateImageUrl: tpl.templateImageUrl || "",
        templateImagePath: tpl.templateImagePath || null,
        templateImageName: tpl.templateImageName || "",
        templateImageFit: normalizeImageFit(tpl.templateImageFit),
        bleedImageUrl: tpl.bleedImageUrl || "",
        bleedImagePath: tpl.bleedImagePath || null,
        bleedImageName: tpl.bleedImageName || "",
        safeImageUrl: tpl.safeImageUrl || "",
        safeImagePath: tpl.safeImagePath || null,
        safeImageName: tpl.safeImageName || ""
      }));
  }
  return [DEFAULT_TEMPLATE];
}

function saveTemplatesLocal(templates){
  localStorage.setItem(STORE_KEYS.templates, JSON.stringify(templates));
}

function loadAssetsLocal(){
  const saved = safeJsonParse(localStorage.getItem(STORE_KEYS.assets), null);
  if(Array.isArray(saved)){
    return saved
      .filter((asset) => asset && asset.id)
      .map((asset) => ({
        id: asset.id,
        productId: asset.productId || DEFAULT_PRODUCT.id,
        title: asset.title || asset.name || "",
        name: asset.name || "image",
        size: Number(asset.size || 0),
        type: asset.type || "image/*",
        previewUrl: asset.previewUrl || asset.dataUrl || "",
        storagePath: asset.storagePath || null,
        createdAt: asset.createdAt || new Date().toISOString(),
        source: asset.source || "local"
      }))
      .filter((asset) => !!asset.previewUrl);
  }
  return [];
}

function saveAssetsLocal(assets){
  localStorage.setItem(STORE_KEYS.assets, JSON.stringify(assets));
}

function templateToRow(tpl){
  return {
    id: tpl.id,
    product_id: tpl.productId || DEFAULT_PRODUCT.id,
    page_group: normalizeTemplatePageGroup(tpl.pageGroup, tpl.productId || DEFAULT_PRODUCT.id),
    page_name: normalizeTemplatePageName(tpl.pageName),
    name: tpl.name,
    width_mm: tpl.mm.w,
    height_mm: tpl.mm.h,
    bleed_mm: tpl.bleed_mm,
    safe_mm: tpl.safe_mm,
    dpi: tpl.export.dpi,
    template_image_url: tpl.templateImageUrl || "",
    template_image_path: tpl.templateImagePath || null,
    template_image_name: tpl.templateImageName || "",
    template_image_fit: normalizeImageFit(tpl.templateImageFit),
    bleed_image_url: tpl.bleedImageUrl || "",
    bleed_image_path: tpl.bleedImagePath || null,
    bleed_image_name: tpl.bleedImageName || "",
    safe_image_url: tpl.safeImageUrl || "",
    safe_image_path: tpl.safeImagePath || null,
    safe_image_name: tpl.safeImageName || "",
    active: true
  };
}

function rowToTemplate(row){
  const productId = row.product_id || DEFAULT_PRODUCT.id;
  return {
    id: row.id,
    name: row.name,
    productId,
    pageGroup: normalizeTemplatePageGroup(row.page_group, productId),
    pageName: normalizeTemplatePageName(row.page_name),
    mm: { w: Number(row.width_mm), h: Number(row.height_mm) },
    bleed_mm: Number(row.bleed_mm),
    safe_mm: Number(row.safe_mm),
    export: { dpi: Number(row.dpi) },
    templateImageUrl: row.template_image_url || "",
    templateImagePath: row.template_image_path || null,
    templateImageName: row.template_image_name || "",
    templateImageFit: normalizeImageFit(row.template_image_fit),
    bleedImageUrl: row.bleed_image_url || "",
    bleedImagePath: row.bleed_image_path || null,
    bleedImageName: row.bleed_image_name || "",
    safeImageUrl: row.safe_image_url || "",
    safeImagePath: row.safe_image_path || null,
    safeImageName: row.safe_image_name || ""
  };
}

function rowToAsset(row){
  return {
    id: row.id,
    productId: row.product_id || DEFAULT_PRODUCT.id,
    title: row.title || row.name || "",
    name: row.name || "image",
    size: Number(row.size || 0),
    type: row.mime_type || "image/*",
    previewUrl: row.public_url || "",
    storagePath: row.storage_path || null,
    createdAt: row.created_at || new Date().toISOString(),
    source: "supabase"
  };
}

async function connectSupabase(){
  sbLastError = "";
  if(!sbConfig.url || !sbConfig.anonKey){
    sbLastError = "URL 또는 Anon Key가 비어 있습니다.";
    useSupabase = false;
    supabaseClient = null;
    setSbStatus(getSbStatusText(), false);
    return false;
  }
  if(!/^https?:\/\/.+/i.test(sbConfig.url)){
    sbLastError = "Project URL 형식이 올바르지 않습니다. 예: https://xxxxx.supabase.co";
    useSupabase = false;
    supabaseClient = null;
    setSbStatus(getSbStatusText(), false);
    return false;
  }
  if(!window.supabase){
    sbLastError = "Supabase SDK가 로드되지 않았습니다.";
    useSupabase = false;
    supabaseClient = null;
    setSbStatus(getSbStatusText(), false);
    return false;
  }
  try {
    supabaseClient = window.supabase.createClient(sbConfig.url, sbConfig.anonKey);

    // Fast ping to verify auth/table access before enabling remote mode.
    const { error: tplError } = await supabaseClient
      .from(SB_TABLES.templates)
      .select("id", { count: "exact", head: true })
      .limit(1);
    if(tplError) throw tplError;

    const { error: assetError } = await supabaseClient
      .from(SB_TABLES.assets)
      .select("id", { count: "exact", head: true })
      .limit(1);
    if(assetError) throw assetError;

    const bucket = (sbConfig.bucket || "editor-assets").trim() || "editor-assets";
    const probe = await supabaseClient.storage.from(bucket).list("", { limit: 1 });
    if(probe.error) throw probe.error;

    useSupabase = true;
    setSbStatus(getSbStatusText(), true);
    return true;
  } catch (err) {
    sbLastError = parseSbError(err, "연결 테스트 중 오류가 발생했습니다.");
    useSupabase = false;
    supabaseClient = null;
    setSbStatus(getSbStatusText(), false);
    return false;
  }
}

function isMissingColumnError(err, columnName){
  const text = parseSbError(err, "");
  return text.includes(columnName) && (text.includes("does not exist") || text.includes("column"));
}

function isAnyMissingColumnError(err, columnNames){
  return (columnNames || []).some((name) => isMissingColumnError(err, name));
}

function isMissingTableError(err, tableName){
  const text = parseSbError(err, "");
  return text.includes(tableName) && (text.includes("does not exist") || text.includes("relation"));
}

async function fetchProducts(){
  if(useSupabase && supabaseClient){
    try {
      let data = null;
      let error = null;
      ({ data, error } = await supabaseClient
        .from(SB_TABLES.products)
        .select("id,name,canvas_mode,category,base_price,is_published,active")
        .eq("active", true)
        .order("created_at", { ascending: true }));
      if(error && isAnyMissingColumnError(error, ["category", "base_price", "is_published"])){
        ({ data, error } = await supabaseClient
          .from(SB_TABLES.products)
          .select("id,name,canvas_mode,active")
          .eq("active", true)
          .order("created_at", { ascending: true }));
      }
      if(error) throw error;

      const mapped = (data || [])
        .filter((x) => x && x.id && x.name)
        .map((x) => ({
          id: x.id,
          name: x.name,
          canvasMode: (x.canvas_mode === "compact" || x.canvas_mode === "focus") ? x.canvas_mode : "fit",
          category: String(x.category || DEFAULT_PRODUCT.category),
          basePrice: Math.max(0, Number(x.base_price || 0)),
          isPublished: x.is_published !== false
        }));
      if(mapped.length){
        saveProductsLocal(mapped);
        return mapped;
      }
    } catch (err) {
      if(!isMissingTableError(err, SB_TABLES.products)){
        sbLastError = parseSbError(err, "원격 상품 조회에 실패했습니다.");
        useSupabase = false;
        supabaseClient = null;
        setSbStatus(getSbStatusText(), false);
      }
    }
  }

  const local = loadProductsLocal();
  return local.length ? local : [DEFAULT_PRODUCT];
}

async function upsertProduct(product){
  localStorage.setItem(CMS_ALL_PRODUCTS_DELETED_KEY, JSON.stringify(false));
  if(useSupabase && supabaseClient){
    try {
      let row = {
        id: product.id,
        name: product.name,
        canvas_mode: product.canvasMode || "fit",
        category: product.category || DEFAULT_PRODUCT.category,
        base_price: Math.max(0, Number(product.basePrice || 0)),
        is_published: product.isPublished !== false,
        active: true
      };
      let { error } = await supabaseClient
        .from(SB_TABLES.products)
        .upsert(row, { onConflict: "id" });
      if(error && isAnyMissingColumnError(error, ["category", "base_price", "is_published"])){
        row = {
          id: product.id,
          name: product.name,
          canvas_mode: product.canvasMode || "fit",
          active: true
        };
        ({ error } = await supabaseClient
          .from(SB_TABLES.products)
          .upsert(row, { onConflict: "id" }));
      }
      if(error) throw error;
      return;
    } catch (err) {
      if(!isMissingTableError(err, SB_TABLES.products)) throw err;
    }
  }

  const next = [...products];
  const idx = next.findIndex((x) => x.id === product.id);
  if(idx >= 0) next[idx] = product;
  else next.push(product);
  saveProductsLocal(next);
}

async function removeProductById(id){
  if(useSupabase && supabaseClient){
    try {
      const { error } = await supabaseClient
        .from(SB_TABLES.products)
        .delete()
        .eq("id", id);
      if(error) throw error;
      return;
    } catch (err) {
      if(!isMissingTableError(err, SB_TABLES.products)) throw err;
    }
  }

  saveProductsLocal(products.filter((x) => x.id !== id));
}

async function fetchTemplates(){
  if(useSupabase && supabaseClient){
    try {
      let data = null;
      let error = null;
      ({ data, error } = await supabaseClient
        .from(SB_TABLES.templates)
        .select("id,product_id,page_group,page_name,name,width_mm,height_mm,bleed_mm,safe_mm,dpi,template_image_url,template_image_path,template_image_name,template_image_fit,bleed_image_url,bleed_image_path,bleed_image_name,safe_image_url,safe_image_path,safe_image_name,active")
        .eq("active", true)
        .order("created_at", { ascending: true }));

      if(error && isAnyMissingColumnError(error, ["template_image_url", "template_image_path", "template_image_name", "template_image_fit", "bleed_image_url", "bleed_image_path", "bleed_image_name", "safe_image_url", "safe_image_path", "safe_image_name", "page_group", "page_name"])){
        ({ data, error } = await supabaseClient
          .from(SB_TABLES.templates)
          .select("id,product_id,page_group,page_name,name,width_mm,height_mm,bleed_mm,safe_mm,dpi,active")
          .eq("active", true)
          .order("created_at", { ascending: true }));
      }

      if(error && isAnyMissingColumnError(error, ["product_id", "page_group", "page_name"])){
        ({ data, error } = await supabaseClient
          .from(SB_TABLES.templates)
          .select("id,name,width_mm,height_mm,bleed_mm,safe_mm,dpi,active")
          .eq("active", true)
          .order("created_at", { ascending: true }));
      }

      if(error) throw error;
      const mapped = (data || []).map(rowToTemplate);
      if(mapped.length){
        saveTemplatesLocal(mapped);
        return mapped;
      }

      await upsertTemplate(DEFAULT_TEMPLATE);
      return [DEFAULT_TEMPLATE];
    } catch (err) {
      sbLastError = parseSbError(err, "원격 템플릿 조회에 실패했습니다.");
      useSupabase = false;
      supabaseClient = null;
      setSbStatus(getSbStatusText(), false);
    }
  }
  const local = loadTemplatesLocal();
  return local.length ? local : [DEFAULT_TEMPLATE];
}

async function fetchAssets(){
  if(useSupabase && supabaseClient){
    try {
      let data = null;
      let error = null;
      ({ data, error } = await supabaseClient
        .from(SB_TABLES.assets)
        .select("id,product_id,title,name,size,mime_type,storage_path,public_url,active,created_at")
        .eq("active", true)
        .order("created_at", { ascending: false }));

      if(error && isMissingColumnError(error, "product_id")){
        ({ data, error } = await supabaseClient
          .from(SB_TABLES.assets)
          .select("id,title,name,size,mime_type,storage_path,public_url,active,created_at")
          .eq("active", true)
          .order("created_at", { ascending: false }));
      }

      if(error) throw error;
      const mapped = (data || []).map(rowToAsset).filter((x) => x.previewUrl);
      saveAssetsLocal(mapped);
      return mapped;
    } catch (err) {
      sbLastError = parseSbError(err, "원격 이미지 조회에 실패했습니다.");
      useSupabase = false;
      supabaseClient = null;
      setSbStatus(getSbStatusText(), false);
    }
  }
  return loadAssetsLocal();
}

async function upsertTemplate(tpl){
  if(useSupabase && supabaseClient){
    // Ensure referenced product exists before template FK write.
    try {
      const product = products.find((p) => p.id === (tpl.productId || DEFAULT_PRODUCT.id));
      let row = {
        id: tpl.productId || DEFAULT_PRODUCT.id,
        name: product?.name || tpl.productId || "상품",
        canvas_mode: product?.canvasMode || "fit",
        category: product?.category || DEFAULT_PRODUCT.category,
        base_price: Math.max(0, Number(product?.basePrice || 0)),
        is_published: product?.isPublished !== false,
        active: true
      };
      let { error: productErr } = await supabaseClient
        .from(SB_TABLES.products)
        .upsert(row, { onConflict: "id" });
      if(productErr && isAnyMissingColumnError(productErr, ["category", "base_price", "is_published"])){
        row = {
          id: tpl.productId || DEFAULT_PRODUCT.id,
          name: product?.name || tpl.productId || "상품",
          canvas_mode: product?.canvasMode || "fit",
          active: true
        };
        ({ error: productErr } = await supabaseClient
          .from(SB_TABLES.products)
          .upsert(row, { onConflict: "id" }));
      }
      if(productErr && !isMissingTableError(productErr, SB_TABLES.products)) throw productErr;
    } catch {}

    let { error } = await supabaseClient
      .from(SB_TABLES.templates)
      .upsert(templateToRow(tpl), { onConflict: "id" });
    if(error && isAnyMissingColumnError(error, ["template_image_url", "template_image_path", "template_image_name", "template_image_fit", "bleed_image_url", "bleed_image_path", "bleed_image_name", "safe_image_url", "safe_image_path", "safe_image_name", "page_group", "page_name"])){
      const noImageRow = {
        id: tpl.id,
        product_id: tpl.productId || DEFAULT_PRODUCT.id,
        page_group: normalizeTemplatePageGroup(tpl.pageGroup, tpl.productId || DEFAULT_PRODUCT.id),
        page_name: normalizeTemplatePageName(tpl.pageName),
        name: tpl.name,
        width_mm: tpl.mm.w,
        height_mm: tpl.mm.h,
        bleed_mm: tpl.bleed_mm,
        safe_mm: tpl.safe_mm,
        dpi: tpl.export.dpi,
        active: true
      };
      ({ error } = await supabaseClient
        .from(SB_TABLES.templates)
        .upsert(noImageRow, { onConflict: "id" }));
    }
    if(error && isAnyMissingColumnError(error, ["product_id", "page_group", "page_name"])){
      const legacyRow = {
        id: tpl.id,
        name: tpl.name,
        width_mm: tpl.mm.w,
        height_mm: tpl.mm.h,
        bleed_mm: tpl.bleed_mm,
        safe_mm: tpl.safe_mm,
        dpi: tpl.export.dpi,
        active: true
      };
      ({ error } = await supabaseClient
        .from(SB_TABLES.templates)
        .upsert(legacyRow, { onConflict: "id" }));
    }
    if(error && String(error.code || "") === "23503"){
      const rowNoProduct = templateToRow({ ...tpl, productId: null });
      ({ error } = await supabaseClient
        .from(SB_TABLES.templates)
        .upsert(rowNoProduct, { onConflict: "id" }));
    }
    if(error) throw error;
    return;
  }
  const next = [...templates];
  const idx = next.findIndex((x) => x.id === tpl.id);
  if(idx >= 0) next[idx] = tpl;
  else next.push(tpl);
  saveTemplatesLocal(next);
}

async function removeTemplateById(id){
  if(useSupabase && supabaseClient){
    const { error } = await supabaseClient
      .from(SB_TABLES.templates)
      .delete()
      .eq("id", id);
    if(error) throw error;
    return;
  }
  saveTemplatesLocal(templates.filter((x) => x.id !== id));
}

async function addAssetFromFile(file, title, productId){
  if(useSupabase && supabaseClient){
    const storagePath = `assets/${Date.now()}_${uid("f")}_${sanitizeFileName(file.name)}`;
    const bucket = sbConfig.bucket || "editor-assets";

    const upload = await supabaseClient.storage
      .from(bucket)
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if(upload.error) throw upload.error;

    const pub = supabaseClient.storage.from(bucket).getPublicUrl(storagePath);
    const publicUrl = pub?.data?.publicUrl || "";

    const payload = {
      product_id: productId || DEFAULT_PRODUCT.id,
      title: title || file.name,
      name: file.name,
      size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
      public_url: publicUrl,
      active: true
    };

    let data = null;
    let error = null;
    ({ data, error } = await supabaseClient
      .from(SB_TABLES.assets)
      .insert(payload)
      .select("id,product_id,title,name,size,mime_type,storage_path,public_url,active,created_at")
      .single());

    if(error && isMissingColumnError(error, "product_id")){
      const legacyPayload = {
        title: title || file.name,
        name: file.name,
        size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        public_url: publicUrl,
        active: true
      };
      ({ data, error } = await supabaseClient
        .from(SB_TABLES.assets)
        .insert(legacyPayload)
        .select("id,title,name,size,mime_type,storage_path,public_url,active,created_at")
        .single());
    }

    if(error) throw error;
    return rowToAsset(data);
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    id: uid("asset"),
    productId: productId || DEFAULT_PRODUCT.id,
    title: title || file.name,
    name: file.name,
    size: file.size,
    type: file.type,
    previewUrl: dataUrl,
    storagePath: null,
    createdAt: new Date().toISOString(),
    source: "local"
  };
}

async function addTemplateImageFromFile(file, templateId, role){
  if(useSupabase && supabaseClient){
    const rawTemplateId = (templateId || "template").trim() || "template";
    const safeTemplateId = sanitizeFileName(rawTemplateId) || "template";
    const safeRole = (role || "base").replace(/[^a-zA-Z0-9_-]/g, "_");
    const storagePath = `templates/${safeTemplateId}/${safeRole}/${Date.now()}_${uid("tpl")}_${sanitizeFileName(file.name)}`;
    const bucket = sbConfig.bucket || "editor-assets";

    const upload = await supabaseClient.storage
      .from(bucket)
      .upload(storagePath, file, { contentType: file.type || "image/png", upsert: false });
    if(upload.error) throw upload.error;

    const pub = supabaseClient.storage.from(bucket).getPublicUrl(storagePath);
    return {
      url: pub?.data?.publicUrl || "",
      storagePath,
      name: file.name || "template.png"
    };
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    url: dataUrl,
    storagePath: null,
    name: file.name || "template.png"
  };
}

async function removeAsset(asset){
  if(useSupabase && supabaseClient){
    const bucket = sbConfig.bucket || "editor-assets";
    if(asset.storagePath){
      const rem = await supabaseClient.storage.from(bucket).remove([asset.storagePath]);
      if(rem.error) throw rem.error;
    }

    const { error } = await supabaseClient
      .from(SB_TABLES.assets)
      .delete()
      .eq("id", asset.id);

    if(error) throw error;
    return;
  }

  saveAssetsLocal(assets.filter((x) => x.id !== asset.id));
}

let products = loadProductsLocal();
let productMakeTypes = loadProductMakeTypes();
let productDefaultAssets = loadProductDefaultAssets();
let productCategories = loadProductCategories();
let templates = loadTemplatesLocal();
let assets = loadAssetsLocal();
if(!products.length) products = [DEFAULT_PRODUCT];
if(!templates.length) templates = [DEFAULT_TEMPLATE];

const state = {
  mode: normalizeEditorMode("user"),
  productId: products[0]?.id || DEFAULT_PRODUCT.id,
  orderType: "",
  makeType: "",
  qty: 1,
  textLine: "",
  note: "",
  image: null,
  imageLayers: [],
  activeLayerId: null,
  img: { x: 0, y: 0, w: 320, h: 240, aspect: 0.75, baseW: 320, baseH: 240 },
  txt: { x: 0, y: 0, size: 26 },
  show: { bleed:true, safe:true, text:true, guides:true },
  selected: null,
  selectedAssetId: null,
  drawerPanel: "flow",
  templatePreviewUrl: "",
  bleedPreviewUrl: "",
  safePreviewUrl: ""
};
const historyPast = [];
const historyFuture = [];
let historyDebounceTimer = null;
let autosaveDebounceTimer = null;
let isApplyingHistory = false;
let pendingAdminAssetFiles = [];
let pendingAdminTemplateFile = null;
let pendingAdminBleedFile = null;
let pendingAdminSafeFile = null;

let currentTemplate = templates[0];
let dpi = currentTemplate.export.dpi;
let tplW = 0;
let tplH = 0;
let frameScale = 1;
let frameW = 0;
let frameH = 0;
let mmPerPxX = 1;
let mmPerPxY = 1;

const work = $("work");
const frame = $("frame");
const safeBox = $("safeBox");
const drawerButtons = Array.from(document.querySelectorAll(".dockBtn[data-drawer-target]"));
const drawerPanels = Array.from(document.querySelectorAll(".dockPanel[data-drawer-panel]"));
const uploadedImageCache = new Map();

function setDraftState(text){
  const el = $("draftState");
  if(el) el.textContent = text;
}

function cacheUploadedImageSource(src, existingKey){
  if(!src || typeof src !== "string") return null;
  const key = existingKey || uid("upload_preview");
  uploadedImageCache.set(key, src);
  if(uploadedImageCache.size > 24){
    const first = uploadedImageCache.keys().next().value;
    uploadedImageCache.delete(first);
  }
  return key;
}

function makeLayerName(meta){
  const base = (meta?.title || meta?.name || "").trim();
  if(base) return base;
  return `레이어 ${state.imageLayers.length + 1}`;
}

function getImageLayerById(id){
  return state.imageLayers.find((x) => x.id === id) || null;
}

function getActiveImageLayer(){
  if(!state.activeLayerId) return null;
  return getImageLayerById(state.activeLayerId);
}

function getActiveImageLayerEl(){
  if(!state.activeLayerId) return null;
  return work.querySelector(`.layer[data-layer-id="${state.activeLayerId}"]`);
}

function syncLegacyImageStateFromActiveLayer(){
  const layer = getActiveImageLayer();
  if(!layer){
    state.image = null;
    state.activeLayerId = null;
    state.selectedAssetId = null;
    return;
  }
  state.img = {
    x: layer.x,
    y: layer.y,
    w: layer.w,
    h: layer.h,
    aspect: layer.aspect,
    baseW: layer.baseW,
    baseH: layer.baseH
  };
  state.image = {
    source: layer.source,
    assetId: layer.assetId || null,
    productId: layer.productId || state.productId || DEFAULT_PRODUCT.id,
    title: layer.title || "",
    name: layer.name || layer.fileName || "",
    size: layer.size || 0,
    type: layer.type || "image/*",
    uploadCacheKey: layer.uploadCacheKey || null
  };
  state.selectedAssetId = layer.assetId || null;
}

function applyLayerStyle(layer, el){
  if(!layer || !el) return;
  el.style.width = layer.w + "px";
  el.style.height = layer.h + "px";
  el.style.transform = `translate(calc(-50% + ${layer.x}px), calc(-50% + ${layer.y}px))`;
  el.style.display = layer.visible ? "block" : "none";
  el.style.opacity = String(clamp(layer.opacity ?? 1, 0, 1));
  el.style.mixBlendMode = layer.blendMode || "normal";
  el.style.zIndex = String(30 + state.imageLayers.indexOf(layer));
  el.classList.toggle("selected", state.selected === "img" && state.activeLayerId === layer.id);
}

function makeImageLayerFromSource(src, meta){
  const uploadCacheKey = meta.source === "upload" ? cacheUploadedImageSource(src, meta.uploadCacheKey) : null;
  const active = getActiveImageLayer();
  const baseX = active ? active.x : 0;
  const baseY = active ? active.y : 0;
  const shift = Math.min(120, state.imageLayers.length * 12);
  const layer = {
    id: uid("layer"),
    name: makeLayerName(meta),
    src,
    source: meta.source || "upload",
    assetId: meta.assetId || null,
    productId: meta.productId || state.productId || DEFAULT_PRODUCT.id,
    title: meta.title || "",
    fileName: meta.name || "",
    size: meta.size || 0,
    type: meta.type || "image/*",
    uploadCacheKey,
    x: baseX + shift,
    y: baseY + shift,
    w: 320,
    h: 240,
    aspect: 0.75,
    baseW: 320,
    baseH: 240,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "normal"
  };
  state.imageLayers.push(layer);
  state.activeLayerId = layer.id;
  syncLegacyImageStateFromActiveLayer();
  return layer;
}

function captureEditorSnapshot(){
  const imageLayers = state.imageLayers.map((layer) => ({
    ...layer,
    src: layer.source === "upload" ? "" : layer.src
  }));
  return {
    mode: state.mode,
    productId: state.productId,
    templateId: currentTemplate?.id || "",
    orderType: state.orderType,
    makeType: state.makeType,
    qty: state.qty,
    textLine: state.textLine,
    note: state.note,
    selected: state.selected || null,
    selectedAssetId: state.selectedAssetId || null,
    drawerPanel: state.drawerPanel || "",
    show: { ...state.show },
    activeLayerId: state.activeLayerId || null,
    imageLayers,
    img: { ...state.img },
    txt: { ...state.txt },
    image: state.image ? { ...state.image } : null
  };
}

function snapshotEquals(a, b){
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function saveDraftNow(){
  try {
    const snapshot = captureEditorSnapshot();
    snapshot.imageLayers = snapshot.imageLayers.filter((layer) => layer.source !== "upload");
    if(snapshot.image?.source === "upload") snapshot.image = null;
    if(snapshot.selectedAssetId && !snapshot.imageLayers.some((x) => x.assetId === snapshot.selectedAssetId)){
      snapshot.selectedAssetId = null;
    }
    if(snapshot.activeLayerId && !snapshot.imageLayers.some((x) => x.id === snapshot.activeLayerId)){
      snapshot.activeLayerId = snapshot.imageLayers[snapshot.imageLayers.length - 1]?.id || null;
    }
    localStorage.setItem(STORE_KEYS.editorDraft, JSON.stringify({
      version: 1,
      savedAt: new Date().toISOString(),
      snapshot
    }));
    setDraftState("저장됨");
  } catch {
    setDraftState("실패");
  }
}

function queueDraftSave(){
  if(isApplyingHistory) return;
  setDraftState("저장중");
  clearTimeout(autosaveDebounceTimer);
  autosaveDebounceTimer = setTimeout(saveDraftNow, 450);
}

function updateHistoryButtons(){
  const undoBtn = $("undo");
  const redoBtn = $("redo");
  if(undoBtn) undoBtn.disabled = historyPast.length <= 1;
  if(redoBtn) redoBtn.disabled = historyFuture.length === 0;
}

function pushHistoryCheckpoint(){
  if(isApplyingHistory) return;
  const snap = captureEditorSnapshot();
  const prev = historyPast[historyPast.length - 1];
  if(prev && snapshotEquals(prev, snap)) return;
  historyPast.push(snap);
  if(historyPast.length > HISTORY_LIMIT) historyPast.shift();
  historyFuture.length = 0;
  updateHistoryButtons();
}

function queueHistoryCheckpoint(){
  if(isApplyingHistory) return;
  clearTimeout(historyDebounceTimer);
  historyDebounceTimer = setTimeout(pushHistoryCheckpoint, 280);
}

function resolveSnapshotImageSource(meta){
  if(!meta) return "";
  if(meta.source === "library"){
    const asset = assets.find((x) => x.id === meta.assetId);
    return asset?.previewUrl || "";
  }
  if(meta.source === "upload"){
    return meta.uploadCacheKey ? (uploadedImageCache.get(meta.uploadCacheKey) || "") : "";
  }
  return "";
}

function applyEditorSnapshot(snapshot){
  if(!snapshot) return;
  isApplyingHistory = true;

  try {
    state.mode = normalizeEditorMode(snapshot.mode);
    renderMode();

    state.productId = products.some((p) => p.id === snapshot.productId)
      ? snapshot.productId
      : (products[0]?.id || DEFAULT_PRODUCT.id);

    $("product").value = state.productId;
    $("adminTplProduct").value = state.productId;
    $("adminImageProduct").value = state.productId;
    $("adminOptionProduct").value = state.productId;
    $("adminDefaultProduct").value = state.productId;
    renderMakeTypeSelect();
    syncAdminMakeTypeInput();
    renderDefaultAssetSelect(state.productId);

    renderTemplateSelect();
    const filteredTemplates = getTemplatesForCurrentProduct();
    const targetTemplate = filteredTemplates.find((tpl) => tpl.id === snapshot.templateId) || filteredTemplates[0];
    if(targetTemplate){
      currentTemplate = targetTemplate;
      $("template").value = targetTemplate.id;
      $("adminTplImageFit").value = normalizeImageFit(targetTemplate.templateImageFit);
      state.templatePreviewUrl = "";
      state.bleedPreviewUrl = "";
      state.safePreviewUrl = "";
      applyTemplateGeometry(targetTemplate);
      resizeRulers();
    }

    state.orderType = snapshot.orderType || "";
    state.makeType = snapshot.makeType || "";
    state.qty = Math.max(1, Number(snapshot.qty || 1));
    state.textLine = snapshot.textLine || "";
    state.note = snapshot.note || "";
    state.show = {
      bleed: snapshot.show?.bleed !== false,
      safe: snapshot.show?.safe !== false,
      text: snapshot.show?.text !== false,
      guides: snapshot.show?.guides !== false
    };
    state.imageLayers = Array.isArray(snapshot.imageLayers)
      ? snapshot.imageLayers.map((layer) => {
        const src = layer.src || resolveSnapshotImageSource(layer);
        return {
          id: layer.id || uid("layer"),
          name: layer.name || makeLayerName(layer),
          src: src || "",
          source: layer.source || "library",
          assetId: layer.assetId || null,
          productId: layer.productId || state.productId || DEFAULT_PRODUCT.id,
          title: layer.title || "",
          fileName: layer.fileName || layer.name || "",
          size: Number(layer.size || 0),
          type: layer.type || "image/*",
          uploadCacheKey: layer.uploadCacheKey || null,
          x: Number(layer.x || 0),
          y: Number(layer.y || 0),
          w: Math.max(20, Number(layer.w || 320)),
          h: Math.max(20, Number(layer.h || 240)),
          aspect: Number(layer.aspect || 0.75),
          baseW: Math.max(20, Number(layer.baseW || 320)),
          baseH: Math.max(20, Number(layer.baseH || 240)),
          visible: layer.visible !== false,
          locked: layer.locked === true,
          opacity: clamp(Number(layer.opacity ?? 1), 0, 1),
          blendMode: layer.blendMode || "normal"
        };
      }).filter((x) => !!x.src)
      : [];
    if(!state.imageLayers.length && snapshot.image){
      const src = resolveSnapshotImageSource(snapshot.image);
      if(src){
        state.imageLayers = [{
          id: uid("layer"),
          name: makeLayerName(snapshot.image),
          src,
          source: snapshot.image.source || "library",
          assetId: snapshot.image.assetId || null,
          productId: snapshot.image.productId || state.productId || DEFAULT_PRODUCT.id,
          title: snapshot.image.title || "",
          fileName: snapshot.image.name || "",
          size: Number(snapshot.image.size || 0),
          type: snapshot.image.type || "image/*",
          uploadCacheKey: snapshot.image.uploadCacheKey || null,
          x: Number(snapshot.img?.x || 0),
          y: Number(snapshot.img?.y || 0),
          w: Math.max(20, Number(snapshot.img?.w || 320)),
          h: Math.max(20, Number(snapshot.img?.h || 240)),
          aspect: Number(snapshot.img?.aspect || 0.75),
          baseW: Math.max(20, Number(snapshot.img?.baseW || 320)),
          baseH: Math.max(20, Number(snapshot.img?.baseH || 240)),
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: "normal"
        }];
      }
    }

    state.activeLayerId = snapshot.activeLayerId && state.imageLayers.some((x) => x.id === snapshot.activeLayerId)
      ? snapshot.activeLayerId
      : (state.imageLayers[state.imageLayers.length - 1]?.id || null);
    syncLegacyImageStateFromActiveLayer();
    state.txt = {
      x: Number(snapshot.txt?.x || 0),
      y: Number(snapshot.txt?.y || 0),
      size: clamp(Number(snapshot.txt?.size || 26), Number($("fontSize").min || 8), Number($("fontSize").max || 200))
    };

    $("orderType").value = state.orderType;
    $("qty").value = String(state.qty);
    $("textLine").value = state.textLine;
    $("note").value = state.note;
    $("count").textContent = String(state.textLine.length);
    $("txtLayer").textContent = state.textLine || "문구";
    renderMakeTypeSelect();
    $("makeType").value = state.makeType;

    if($("tgBleed")) $("tgBleed").checked = state.show.bleed;
    if($("tgSafe")) $("tgSafe").checked = state.show.safe;
    if($("tgText")) $("tgText").checked = state.show.text;
    if($("tgGuides")) $("tgGuides").checked = state.show.guides;
    $("bleedBox").style.display = state.show.bleed ? "block" : "none";
    $("safeBox").style.display = state.show.safe ? "block" : "none";
    $("txtLayer").style.display = state.show.text ? "block" : "none";

    const zoom = Math.round((state.img.w / Math.max(1, state.img.baseW || state.img.w)) * 100);
    $("zoom").value = String(clamp(zoom, Number($("zoom").min || 30), Number($("zoom").max || 300)));
    $("zoomVal").textContent = $("zoom").value;
    $("fontSize").value = String(state.txt.size);
    $("fontVal").textContent = String(state.txt.size);

    renderImageLayers();
    renderLayerList();
    applyImgTransform();

    applyTextTransform();
    renderAssetList();
    setDrawerPanel(snapshot.drawerPanel || getDefaultDrawerTarget());
    setSelected(snapshot.selected || null);
    validateAll();
    resizeRulers();
  } finally {
    isApplyingHistory = false;
    updateHistoryButtons();
  }
}

function undoHistory(){
  if(historyPast.length <= 1) return;
  const current = historyPast.pop();
  if(current) historyFuture.push(current);
  const target = historyPast[historyPast.length - 1];
  applyEditorSnapshot(target);
}

function redoHistory(){
  if(!historyFuture.length) return;
  const target = historyFuture.pop();
  if(!target) return;
  historyPast.push(target);
  applyEditorSnapshot(target);
}

function getCurrentProduct(){
  return products.find((p) => p.id === state.productId) || products[0] || DEFAULT_PRODUCT;
}

function getTemplatesForCurrentProduct(){
  const pid = state.productId || DEFAULT_PRODUCT.id;
  return templates.filter((tpl) => (tpl.productId || DEFAULT_PRODUCT.id) === pid);
}

function getTemplatesForPageGroup(productId, pageGroup){
  const pid = productId || DEFAULT_PRODUCT.id;
  const group = normalizeTemplatePageGroup(pageGroup, pid);
  return templates.filter((tpl) =>
    (tpl.productId || DEFAULT_PRODUCT.id) === pid &&
    normalizeTemplatePageGroup(tpl.pageGroup, tpl.productId || DEFAULT_PRODUCT.id) === group
  );
}

function getAssetsForCurrentProduct(){
  const pid = state.productId || DEFAULT_PRODUCT.id;
  return assets.filter((asset) => (asset.productId || DEFAULT_PRODUCT.id) === pid);
}

function getAssetsForProduct(productId){
  const pid = productId || DEFAULT_PRODUCT.id;
  return assets.filter((asset) => (asset.productId || DEFAULT_PRODUCT.id) === pid);
}

function renderImageLayers(){
  const stack = $("imageLayerStack");
  if(!stack) return;
  stack.innerHTML = "";

  state.imageLayers.forEach((layer) => {
    const el = document.createElement("div");
    el.className = "layer";
    el.dataset.layerId = layer.id;
    if(layer.locked) el.dataset.locked = "true";

    const img = document.createElement("img");
    img.src = layer.src;
    img.alt = layer.name || layer.fileName || "layer";
    el.appendChild(img);

    el.addEventListener("click", (evt) => {
      evt.stopPropagation();
      state.activeLayerId = layer.id;
      syncLegacyImageStateFromActiveLayer();
      setSelected("img");
      renderImageLayers();
      renderLayerList();
      applyImgTransform();
    });

    makeDraggable(el, {
      get: () => {
        const cur = getImageLayerById(layer.id) || layer;
        return { x: cur.x, y: cur.y };
      },
      set: (x, y) => {
        const cur = getImageLayerById(layer.id);
        if(!cur || cur.locked) return;
        cur.x = x;
        cur.y = y;
        if(state.activeLayerId === cur.id){
          state.img.x = x;
          state.img.y = y;
          applyImgTransform();
        } else {
          applyLayerStyle(cur, el);
        }
      }
    }, () => {
      const cur = getImageLayerById(layer.id);
      if(!cur || cur.locked) return;
      state.activeLayerId = layer.id;
      syncLegacyImageStateFromActiveLayer();
      setSelected("img");
      renderLayerList();
    });

    applyLayerStyle(layer, el);
    stack.appendChild(el);
  });
}

function syncLayerControls(){
  const layer = getActiveImageLayer();
  const opacity = $("layerOpacity");
  const blend = $("layerBlend");
  if(!opacity || !blend) return;
  const disabled = !layer;
  opacity.disabled = disabled;
  blend.disabled = disabled;
  $("layerUpBtn").disabled = disabled;
  $("layerDownBtn").disabled = disabled;
  $("layerDuplicateBtn").disabled = disabled;
  $("layerDeleteBtn").disabled = disabled;
  if(!layer){
    opacity.value = "100";
    blend.value = "normal";
    return;
  }
  opacity.value = String(Math.round(clamp(layer.opacity ?? 1, 0, 1) * 100));
  blend.value = layer.blendMode || "normal";
}

function renderLayerList(){
  const list = $("layerList");
  if(!list) return;
  list.innerHTML = "";
  const searchEl = $("layerSearch");
  const keyword = String(searchEl?.value || "").trim().toLowerCase();

  if(!state.imageLayers.length){
    const msg = document.createElement("div");
    msg.className = "layerListHint";
    msg.textContent = "레이어가 없습니다. 이미지를 업로드/선택하면 자동으로 새 레이어가 추가됩니다.";
    list.appendChild(msg);
    syncLayerControls();
    return;
  }

  const reversed = [...state.imageLayers].reverse().filter((layer) => {
    if(!keyword) return true;
    const name = String(layer.name || layer.fileName || layer.id || "").toLowerCase();
    return name.includes(keyword);
  });
  if(!reversed.length){
    const msg = document.createElement("div");
    msg.className = "layerListHint";
    msg.textContent = "검색 결과가 없습니다.";
    list.appendChild(msg);
    syncLayerControls();
    return;
  }
  reversed.forEach((layer) => {
    const row = document.createElement("div");
    row.className = "layerRow" + (state.activeLayerId === layer.id ? " selected" : "");
    row.dataset.layerId = layer.id;

    const visBtn = document.createElement("button");
    visBtn.className = "layerEyeBtn";
    visBtn.type = "button";
    visBtn.dataset.action = "toggleVisible";
    visBtn.dataset.id = layer.id;
    visBtn.textContent = layer.visible ? "◉" : "○";

    const swatch = document.createElement("div");
    swatch.className = "layerSwatch";

    const title = document.createElement("div");
    title.className = "layerName";
    title.textContent = layer.name || layer.fileName || layer.id;

    const lockBtn = document.createElement("button");
    lockBtn.className = "layerLockBtn";
    lockBtn.type = "button";
    lockBtn.dataset.action = "toggleLock";
    lockBtn.dataset.id = layer.id;
    lockBtn.textContent = layer.locked ? "🔒" : "◌";

    row.append(visBtn, swatch, title, lockBtn);
    list.appendChild(row);
  });

  syncLayerControls();
}

function setActiveLayerById(id){
  const layer = getImageLayerById(id);
  if(!layer) return;
  state.activeLayerId = id;
  syncLegacyImageStateFromActiveLayer();
  const z = Math.round((state.img.w / Math.max(1, state.img.baseW || state.img.w)) * 100);
  $("zoom").value = String(clamp(z, Number($("zoom").min || 30), Number($("zoom").max || 300)));
  $("zoomVal").textContent = $("zoom").value;
  setSelected("img");
  renderImageLayers();
  renderLayerList();
  applyImgTransform();
}

function moveActiveLayer(direction){
  const idx = state.imageLayers.findIndex((x) => x.id === state.activeLayerId);
  if(idx < 0) return;
  const next = direction === "up" ? idx + 1 : idx - 1;
  if(next < 0 || next >= state.imageLayers.length) return;
  const tmp = state.imageLayers[idx];
  state.imageLayers[idx] = state.imageLayers[next];
  state.imageLayers[next] = tmp;
  renderImageLayers();
  renderLayerList();
  validateAll();
}

function duplicateActiveLayer(){
  const cur = getActiveImageLayer();
  if(!cur) return;
  const next = {
    ...cur,
    id: uid("layer"),
    name: `${cur.name || cur.fileName || "레이어"} 복제`,
    x: cur.x + 12,
    y: cur.y + 12,
    locked: false
  };
  state.imageLayers.push(next);
  setActiveLayerById(next.id);
  validateAll();
}

function removeActiveLayer(){
  const id = state.activeLayerId;
  if(!id) return;
  const idx = state.imageLayers.findIndex((x) => x.id === id);
  if(idx < 0) return;
  state.imageLayers.splice(idx, 1);
  const fallback = state.imageLayers[Math.max(0, idx - 1)] || null;
  state.activeLayerId = fallback?.id || null;
  syncLegacyImageStateFromActiveLayer();
  if(state.activeLayerId){
    const z = Math.round((state.img.w / Math.max(1, state.img.baseW || state.img.w)) * 100);
    $("zoom").value = String(clamp(z, Number($("zoom").min || 30), Number($("zoom").max || 300)));
    $("zoomVal").textContent = $("zoom").value;
  } else {
    $("zoom").value = "100";
    $("zoomVal").textContent = "100";
  }
  if(!fallback){
    state.selected = null;
  } else {
    setSelected("img");
  }
  renderImageLayers();
  renderLayerList();
  validateAll();
}

function renderDefaultAssetSelect(productId){
  const pid = productId || state.productId || DEFAULT_PRODUCT.id;
  const select = $("adminDefaultAsset");
  const list = getAssetsForProduct(pid);
  const currentDefault = productDefaultAssets[pid] || "";

  select.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = list.length ? "선택" : "등록된 이미지 없음";
  select.appendChild(empty);

  list.forEach((asset) => {
    const opt = document.createElement("option");
    opt.value = asset.id;
    opt.textContent = asset.title || asset.name;
    select.appendChild(opt);
  });

  select.value = currentDefault && list.some((a) => a.id === currentDefault) ? currentDefault : "";
  $("adminDefaultInfo").textContent = currentDefault
    ? `현재 기본 이미지: ${(list.find((x) => x.id === currentDefault)?.title || list.find((x) => x.id === currentDefault)?.name || currentDefault)}`
    : "상품 선택 시 자동으로 배경 이미지가 적용됩니다.";
}

function applyDefaultAssetForProduct(productId, force){
  const pid = productId || state.productId || DEFAULT_PRODUCT.id;
  const defaultAssetId = productDefaultAssets[pid];
  if(!defaultAssetId) return false;

  const asset = assets.find((x) => x.id === defaultAssetId && (x.productId || DEFAULT_PRODUCT.id) === pid);
  if(!asset){
    delete productDefaultAssets[pid];
    saveProductDefaultAssets(productDefaultAssets);
    return false;
  }

  if(!force && state.imageLayers.some((x) => x.source === "upload")){
    return false;
  }

  state.selectedAssetId = asset.id;
  $("file").value = "";
  setImageSource(asset.previewUrl, {
    source: "library",
    assetId: asset.id,
    productId: asset.productId || DEFAULT_PRODUCT.id,
    title: asset.title || "",
    name: asset.name,
    size: asset.size,
    type: asset.type
  });
  renderAssetList();
  renderLayerList();
  return true;
}

function getMakeTypesForProduct(productId){
  const pid = productId || state.productId || DEFAULT_PRODUCT.id;
  const list = normalizeMakeTypeList(productMakeTypes[pid] || []);
  return list.length ? list : DEFAULT_MAKE_TYPES;
}

function renderMakeTypeSelect(){
  const select = $("makeType");
  const list = getMakeTypesForProduct(state.productId);
  const prev = state.makeType;
  select.innerHTML = "";

  const emptyOpt = document.createElement("option");
  emptyOpt.value = "";
  emptyOpt.textContent = "선택";
  select.appendChild(emptyOpt);

  list.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    select.appendChild(opt);
  });

  if(prev && list.includes(prev)){
    select.value = prev;
  } else {
    state.makeType = "";
    select.value = "";
  }
}

function syncAdminMakeTypeInput(){
  const pid = $("adminOptionProduct").value || state.productId || DEFAULT_PRODUCT.id;
  const values = getMakeTypesForProduct(pid);
  $("adminMakeTypeInput").value = values.join(", ");
}

function getPreviewFrameBounds(mode){
  const ww = Math.max(320, work?.clientWidth || 1200);
  const wh = Math.max(260, work?.clientHeight || 700);
  const ratio = mode === "focus" ? 0.9 : mode === "compact" ? 0.78 : 0.84;
  return {
    maxW: Math.max(260, Math.floor(ww * ratio)),
    maxH: Math.max(220, Math.floor(wh * ratio))
  };
}

function isDrawerTargetAllowed(target){
  if(!EDITOR_ADMIN_MODE_ENABLED){
    return target === "flow" || target === "assets";
  }
  if(state.mode === "admin"){
    return target === "mode" || target.startsWith("admin");
  }
  return target === "mode" || target === "flow" || target === "assets";
}

function getDefaultDrawerTarget(){
  if(!EDITOR_ADMIN_MODE_ENABLED) return "flow";
  return state.mode === "admin" ? "adminProduct" : "flow";
}

function setDrawerPanel(target){
  const next = isDrawerTargetAllowed(target) ? target : getDefaultDrawerTarget();
  state.drawerPanel = next;

  drawerButtons.forEach((btn) => {
    const t = btn.dataset.drawerTarget;
    btn.classList.toggle("active", t === next);
  });
  drawerPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.drawerPanel === next);
  });
}

function syncDrawerByMode(){
  drawerButtons.forEach((btn) => {
    const visible = isDrawerTargetAllowed(btn.dataset.drawerTarget);
    btn.style.display = visible ? "inline-flex" : "none";
  });
  setDrawerPanel(state.drawerPanel);
}

function applyTemplateGeometry(template){
  currentTemplate = template;
  dpi = currentTemplate.export.dpi;
  tplW = mmToPx(currentTemplate.mm.w + currentTemplate.bleed_mm * 2, dpi);
  tplH = mmToPx(currentTemplate.mm.h + currentTemplate.bleed_mm * 2, dpi);

  const bounds = getPreviewFrameBounds(getCurrentProduct().canvasMode);
  const fitScale = Math.min(bounds.maxW / Math.max(1, tplW), bounds.maxH / Math.max(1, tplH));
  frameScale = Number.isFinite(fitScale) && fitScale > 0 ? fitScale : 1;
  frameW = Math.max(120, Math.round(tplW * frameScale));
  frameH = Math.max(120, Math.round(tplH * frameScale));

  frame.style.width = frameW + "px";
  frame.style.height = frameH + "px";

  const safeInset = Math.round(mmToPx(currentTemplate.safe_mm, dpi) * frameScale);
  safeBox.style.left = safeInset + "px";
  safeBox.style.top = safeInset + "px";
  safeBox.style.right = safeInset + "px";
  safeBox.style.bottom = safeInset + "px";

  mmPerPxX = (currentTemplate.mm.w + currentTemplate.bleed_mm * 2) / frameW;
  mmPerPxY = (currentTemplate.mm.h + currentTemplate.bleed_mm * 2) / frameH;

  applyTemplateBackground();
  applyGuideOverlays();

  const pageName = normalizeTemplatePageName(currentTemplate.pageName);
  $("templateBadge").textContent = `템플릿: ${currentTemplate.name} [${pageName}]`;
  $("safeBadge").textContent = `Bleed ${currentTemplate.bleed_mm}mm / Safe ${currentTemplate.safe_mm}mm`;
  const m = resolveExportMetrics(currentTemplate);
  $("pxBadge").textContent = m.downscaled
    ? `편집(px): ${frameW}×${frameH} / 출력(px): ${m.printW}×${m.printH} @${m.exportDpi}dpi (요청 ${m.requestedDpi})`
    : `편집(px): ${frameW}×${frameH} / 출력(px): ${tplW}×${tplH} (bleed 포함)`;
}

$("addTemplatePageBtn").addEventListener("click", () => {
  let productId = ($("adminTplProduct").value || "").trim();
  if(!productId){
    productId = state.productId || "";
    if(productId) $("adminTplProduct").value = productId;
  }
  if(!productId){
    alert("대상 상품을 먼저 선택하세요.");
    return;
  }

  const currentId = ($("adminTplId").value || "").trim() || `template_${Date.now()}`;
  const idMatch = currentId.match(/^(.*)_p(\d+)$/i);
  const baseId = (idMatch ? idMatch[1] : currentId).trim() || `template_${Date.now()}`;
  const currentPageIdx = idMatch ? Number(idMatch[2]) : 0;
  const groupInput = ($("adminTplPageGroup").value || "").trim();
  const pageGroup = groupInput || `${productId}:${baseId}`;
  $("adminTplPageGroup").value = pageGroup;

  const siblings = templates.filter((tpl) =>
    (tpl.productId || DEFAULT_PRODUCT.id) === productId &&
    normalizeTemplatePageGroup(tpl.pageGroup, tpl.productId || DEFAULT_PRODUCT.id) === pageGroup
  );

  const usedIds = new Set(templates.map((tpl) => tpl.id));
  let idx = Math.max(1, siblings.length + 1, currentPageIdx + 1);
  let nextId = `${baseId}_p${idx}`;
  while(usedIds.has(nextId) || nextId === currentId){
    idx += 1;
    nextId = `${baseId}_p${idx}`;
  }

  const suggestedPageName = idx === 1 ? "앞면" : (idx === 2 ? "뒷면" : `페이지 ${idx}`);
  $("adminTplId").value = nextId;
  $("adminTplPageName").value = suggestedPageName;

  const baseName = ($("adminTplName").value || "").trim();
  if(baseName){
    $("adminTplName").value = baseName.replace(/\s*\[[^\]]+\]\s*$/, "").trim() + ` [${suggestedPageName}]`;
  }
  const info = $("adminTplImageInfo");
  if(info){
    info.textContent = `페이지 초안 생성 완료: ${suggestedPageName} / ID: ${nextId}`;
  }
  syncAdminTemplatePageOptions();
});

function applyTemplateBackground(overrideUrl){
  const layer = $("tplBgLayer");
  const img = $("tplBg");
  const src = overrideUrl || state.templatePreviewUrl || currentTemplate.templateImageUrl || "";
  if(!src){
    layer.style.display = "none";
    img.src = "";
    return;
  }

  layer.style.width = frameW + "px";
  layer.style.height = frameH + "px";
  layer.style.display = "block";
  const fit = normalizeImageFit(currentTemplate.templateImageFit);
  img.style.objectFit = fit === "real" ? "none" : fit;
  img.style.objectPosition = "center";
  img.src = src;
}

function applyGuideOverlays(){
  const fit = normalizeImageFit(currentTemplate.templateImageFit);
  const bleedSrc = state.bleedPreviewUrl || currentTemplate.bleedImageUrl || "";
  const safeSrc = state.safePreviewUrl || currentTemplate.safeImageUrl || "";
  const bleedImg = $("bleedImg");
  const safeImg = $("safeImg");

  if(bleedSrc){
    bleedImg.src = bleedSrc;
    bleedImg.style.display = "block";
    bleedImg.style.objectFit = fit === "real" ? "none" : fit;
    bleedImg.style.objectPosition = "center";
  } else {
    bleedImg.src = "";
    bleedImg.style.display = "none";
  }

  if(safeSrc){
    safeImg.src = safeSrc;
    safeImg.style.display = "block";
    safeImg.style.objectFit = fit === "real" ? "none" : fit;
    safeImg.style.objectPosition = "center";
  } else {
    safeImg.src = "";
    safeImg.style.display = "none";
  }
}

function resolveExportMetrics(template){
  const totalMmW = Number(template.mm.w || 0) + Number(template.bleed_mm || 0) * 2;
  const totalMmH = Number(template.mm.h || 0) + Number(template.bleed_mm || 0) * 2;
  const reqDpi = Math.max(MIN_EXPORT_DPI, Number(template.export?.dpi || 300));

  const reqW = mmToPx(totalMmW, reqDpi);
  const reqH = mmToPx(totalMmH, reqDpi);
  if(reqW <= 0 || reqH <= 0){
    return {
      requestedDpi: reqDpi,
      exportDpi: reqDpi,
      printW: Math.max(1, reqW),
      printH: Math.max(1, reqH),
      downscaled: false
    };
  }

  const areaScale = Math.sqrt(Math.min(1, MAX_EXPORT_PIXELS / (reqW * reqH)));
  const edgeScale = Math.min(1, MAX_EXPORT_EDGE / reqW, MAX_EXPORT_EDGE / reqH);
  const scale = Math.min(areaScale, edgeScale);
  const nextDpi = clamp(Math.floor(reqDpi * scale), MIN_EXPORT_DPI, reqDpi);

  const outW = mmToPx(totalMmW, nextDpi);
  const outH = mmToPx(totalMmH, nextDpi);

  return {
    requestedDpi: reqDpi,
    exportDpi: nextDpi,
    printW: Math.max(1, outW),
    printH: Math.max(1, outH),
    downscaled: nextDpi < reqDpi
  };
}

function getSelectedEl(){
  if(state.selected === "img") return getActiveImageLayerEl();
  if(state.selected === "text") return $("txtLayer");
  return null;
}

function setSelected(which){
  state.selected = which;
  renderImageLayers();
  renderLayerList();
  $("txtLayer").classList.toggle("selected", which === "text");
  const enabled = !!which;
  ["alLeft","alCenter","alRight","alTop","alMiddle","alBottom"].forEach((id) => $(id).disabled = !enabled);
  updateTBox();
}

$("txtLayer").addEventListener("click", (e) => { e.stopPropagation(); setSelected("text"); });
work.addEventListener("click", () => setSelected(null));

function renderMode(){
  state.mode = normalizeEditorMode(state.mode);
  const isAdmin = state.mode === "admin";
  const editorRoot = $("page-editor") || document;
  editorRoot.querySelectorAll(".userOnly").forEach((el) => { el.style.display = isAdmin ? "none" : "block"; });
  editorRoot.querySelectorAll(".adminOnly").forEach((el) => { el.style.display = isAdmin ? "block" : "none"; });
  state.drawerPanel = getDefaultDrawerTarget();
  syncDrawerByMode();
}

drawerButtons.forEach((btn) => {
  btn.addEventListener("click", () => setDrawerPanel(btn.dataset.drawerTarget));
});

const tgBleedEl = $("tgBleed");
if(tgBleedEl){
  tgBleedEl.addEventListener("change", (e) => {
    state.show.bleed = e.target.checked;
    $("bleedBox").style.display = state.show.bleed ? "block" : "none";
  });
}
const tgSafeEl = $("tgSafe");
if(tgSafeEl){
  tgSafeEl.addEventListener("change", (e) => {
    state.show.safe = e.target.checked;
    $("safeBox").style.display = state.show.safe ? "block" : "none";
    validateAll();
  });
}
const tgTextEl = $("tgText");
if(tgTextEl){
  tgTextEl.addEventListener("change", (e) => {
    state.show.text = e.target.checked;
    $("txtLayer").style.display = state.show.text ? "block" : "none";
    validateAll();
  });
}
const tgGuidesEl = $("tgGuides");
if(tgGuidesEl){
  tgGuidesEl.addEventListener("change", (e) => {
    state.show.guides = e.target.checked;
  });
}

$("orderType").addEventListener("change", (e) => {
  state.orderType = e.target.value;
  $("groupNotice").style.display = (state.orderType === "단체") ? "block" : "none";
  validateAll();
});
$("makeType").addEventListener("change", (e) => { state.makeType = e.target.value; validateAll(); });
$("qty").addEventListener("input", (e) => {
  state.qty = Math.max(1, parseInt(e.target.value || "1", 10));
  e.target.value = state.qty;
  validateAll();
});

$("textLine").addEventListener("input", (e) => {
  state.textLine = e.target.value || "";
  $("count").textContent = String(state.textLine.length);
  $("txtLayer").textContent = state.textLine || "문구";
  validateAll();
});
$("note").addEventListener("input", (e) => { state.note = e.target.value || ""; validateAll(); });

$("zoom").addEventListener("input", (e) => {
  const active = getActiveImageLayer();
  if(!active || active.locked) return;
  const input = e.target;
  let v = parseInt(input.value, 10);
  if(!isFinite(v)) return;
  v = Math.max(Number(input.min || 30), Math.min(Number(input.max || 300), v));
  input.value = String(v);
  $("zoomVal").textContent = v;
  const factor = v / 100;
  state.img.w = Math.max(20, Math.round(state.img.baseW * factor));
  state.img.h = Math.max(20, Math.round(state.img.baseH * factor));
  applyImgTransform();
  validateAll();
});

$("fontSize").addEventListener("input", (e) => {
  const input = e.target;
  let v = parseInt(input.value, 10);
  if(!isFinite(v)) return;
  v = Math.max(Number(input.min || 8), Math.min(Number(input.max || 200), v));
  input.value = String(v);
  $("fontVal").textContent = v;
  state.txt.size = v;
  applyTextTransform();
  validateAll();
});

function renderProductControls(){
  const userSelect = $("product");
  const tplProductSelect = $("adminTplProduct");
  const imageProductSelect = $("adminImageProduct");
  const optionProductSelect = $("adminOptionProduct");
  const defaultProductSelect = $("adminDefaultProduct");

  const fill = (el, includeAny) => {
    el.innerHTML = "";
    if(includeAny){
      const anyOpt = document.createElement("option");
      anyOpt.value = "";
      anyOpt.textContent = "공통(전체 상품)";
      el.appendChild(anyOpt);
    }
    products.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      el.appendChild(opt);
    });
  };

  fill(userSelect, false);
  fill(tplProductSelect, false);
  fill(imageProductSelect, true);
  fill(optionProductSelect, false);
  fill(defaultProductSelect, false);

  if(!products.some((p) => p.id === state.productId)){
    state.productId = products[0]?.id || DEFAULT_PRODUCT.id;
  }

  userSelect.value = state.productId;
  tplProductSelect.value = state.productId;
  imageProductSelect.value = state.productId;
  optionProductSelect.value = state.productId;
  defaultProductSelect.value = state.productId;
  renderMakeTypeSelect();
  syncAdminMakeTypeInput();
  renderDefaultAssetSelect(state.productId);
  syncAdminProductManageInputs(state.productId);
}

function getKnownProductCategories(){
  const deleted = new Set(
    (safeJsonParse(localStorage.getItem(CMS_DELETED_CATEGORIES_KEY), []) || [])
      .map((x) => String(x || "").trim())
      .filter(Boolean)
  );
  return normalizeCategoryList([
    ...productCategories,
    ...products.map((p) => p.category)
  ]).filter((name) => !deleted.has(name));
}

function renderAdminProductCategorySelect(selectedCategory){
  const select = $("adminProductCategory");
  if(!select) return;
  const list = getKnownProductCategories();
  select.innerHTML = "";
  list.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
  const selected = String(selectedCategory || "").trim();
  if(selected && list.includes(selected)){
    select.value = selected;
  } else if(list.length){
    select.value = list[0];
  }
}

function renderAdminProductSubcategorySelect(categoryName, selectedSubcategory){
  const select = $("adminProductSubcategory");
  if(!select) return;
  const subtypes = getSubtypesForCategory(categoryName);
  select.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = subtypes.length ? "선택 안함" : "선택 안함 (하위카테고리 미설정)";
  select.appendChild(empty);
  subtypes.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });
  const selected = String(selectedSubcategory || "").trim();
  if(selected && subtypes.includes(selected)){
    select.value = selected;
  } else {
    select.value = "";
  }
}

function renderAdminProductInlineDefaultAssetSelect(productId){
  const select = $("adminProductDefaultAsset");
  if(!select) return;
  const pid = (productId || $("adminProductId")?.value || state.productId || DEFAULT_PRODUCT.id).trim() || DEFAULT_PRODUCT.id;
  const list = getAssetsForProduct(pid);
  const currentDefault = productDefaultAssets[pid] || "";

  select.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = list.length ? "선택 안함" : "선택 안함 (등록된 이미지 없음)";
  select.appendChild(empty);

  list.forEach((asset) => {
    const opt = document.createElement("option");
    opt.value = asset.id;
    opt.textContent = asset.title || asset.name;
    select.appendChild(opt);
  });

  select.value = currentDefault && list.some((x) => x.id === currentDefault) ? currentDefault : "";
}

function syncAdminProductManageInputs(productId){
  const idEl = $("adminProductId");
  const nameEl = $("adminProductName");
  const categoryEl = $("adminProductCategory");
  const canvasEl = $("adminProductCanvasMode");
  const makeTypeEl = $("adminProductMakeTypeInput");
  if(!idEl || !nameEl || !categoryEl || !canvasEl || !makeTypeEl) return;

  const pid = (productId || idEl.value || state.productId || DEFAULT_PRODUCT.id).trim() || DEFAULT_PRODUCT.id;
  const hit = products.find((p) => p.id === pid);
  const metaMap = loadCmsProductMetaMap();
  const currentSubcategory = String(metaMap[pid]?.subcategory || "").trim();
  renderAdminProductCategorySelect(hit?.category || DEFAULT_PRODUCT.category);
  if(hit){
    idEl.value = hit.id;
    nameEl.value = hit.name;
    categoryEl.value = hit.category || DEFAULT_PRODUCT.category;
    canvasEl.value = hit.canvasMode || "fit";
  } else {
    categoryEl.value = DEFAULT_PRODUCT.category;
  }
  renderAdminProductSubcategorySelect(categoryEl.value, currentSubcategory);
  makeTypeEl.value = getMakeTypesForProduct(pid).join(", ");
  renderAdminProductInlineDefaultAssetSelect(pid);
}

function renderAdminProductList(){
  const list = $("adminProductList");
  list.innerHTML = "";

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "assetCard";

    const title = document.createElement("div");
    title.className = "assetTitle";
    title.textContent = product.name;

    const modeLabel = product.canvasMode === "compact"
      ? "컴팩트"
      : product.canvasMode === "focus"
        ? "포커스"
        : "기본";

    const meta = document.createElement("div");
    meta.className = "assetMeta";
    meta.textContent = `${product.id} / canvas: ${modeLabel}`;

    const actions = document.createElement("div");
    actions.className = "assetActions";

    const useBtn = document.createElement("button");
    useBtn.className = "btn2";
    useBtn.type = "button";
    useBtn.dataset.action = "use";
    useBtn.dataset.id = product.id;
    useBtn.textContent = "사용";

    const delBtn = document.createElement("button");
    delBtn.className = "btn2";
    delBtn.type = "button";
    delBtn.dataset.action = "delete";
    delBtn.dataset.id = product.id;
    delBtn.textContent = "삭제";

    actions.append(useBtn, delBtn);
    card.append(title, meta, actions);
    list.appendChild(card);
  });
}

async function refreshProductData(){
  products = await fetchProducts();
  if(!products.length && !isAllProductsDeleted()) products = [DEFAULT_PRODUCT];
  saveProductsLocal(products);
  productCategories = normalizeCategoryList([
    ...productCategories,
    ...products.map((p) => p.category)
  ]);
  saveProductCategories(productCategories);

  // Keep only existing product ids and ensure defaults.
  const nextMap = {};
  products.forEach((p) => {
    const list = normalizeMakeTypeList(productMakeTypes[p.id] || []);
    nextMap[p.id] = list.length ? list : DEFAULT_MAKE_TYPES;
  });
  productMakeTypes = nextMap;
  saveProductMakeTypes(productMakeTypes);

  renderProductControls();
  renderAdminProductList();
}

function renderTemplateSelect(){
  const select = $("template");
  const filtered = getTemplatesForCurrentProduct();
  select.innerHTML = "";

  if(!filtered.length){
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "등록된 템플릿 없음";
    select.appendChild(opt);
    select.disabled = true;
    currentTemplate = templates[0] || DEFAULT_TEMPLATE;
    applyTemplateGeometry(currentTemplate);
    resizeRulers();
    validateAll();
    return;
  }

  select.disabled = false;
  filtered.forEach((tpl) => {
    const opt = document.createElement("option");
    opt.value = tpl.id;
    const pageName = normalizeTemplatePageName(tpl.pageName);
    opt.textContent = `${tpl.name} [${pageName}]`;
    select.appendChild(opt);
  });

  const hasCurrent = filtered.some((tpl) => tpl.id === currentTemplate.id);
  if(!hasCurrent) currentTemplate = filtered[0];

  select.value = currentTemplate.id;
  $("adminTplPageGroup").value = normalizeTemplatePageGroup(currentTemplate.pageGroup, currentTemplate.productId || DEFAULT_PRODUCT.id);
  $("adminTplPageName").value = normalizeTemplatePageName(currentTemplate.pageName);
  $("adminTplImageFit").value = normalizeImageFit(currentTemplate.templateImageFit);
  state.templatePreviewUrl = "";
  state.bleedPreviewUrl = "";
  state.safePreviewUrl = "";
  applyTemplateGeometry(currentTemplate);
  resizeRulers();
  validateAll();
  syncAdminTemplatePageOptions(currentTemplate.id);
}

$("product").addEventListener("change", (e) => {
  state.productId = e.target.value || products[0]?.id || DEFAULT_PRODUCT.id;
  $("adminTplProduct").value = state.productId;
  $("adminImageProduct").value = state.productId;
  $("adminOptionProduct").value = state.productId;
  $("adminDefaultProduct").value = state.productId;
  renderMakeTypeSelect();
  syncAdminMakeTypeInput();
  renderDefaultAssetSelect(state.productId);
  state.imageLayers = [];
  state.activeLayerId = null;
  syncLegacyImageStateFromActiveLayer();
  renderImageLayers();
  renderLayerList();
  $("file").value = "";
  renderTemplateSelect();
  renderAssetList();
  applyDefaultAssetForProduct(state.productId, true);
  validateAll();
});

$("template").addEventListener("change", (e) => {
  const filtered = getTemplatesForCurrentProduct();
  const next = filtered.find((tpl) => tpl.id === e.target.value);
  if(!next) return;
  $("adminTplPageGroup").value = normalizeTemplatePageGroup(next.pageGroup, next.productId || DEFAULT_PRODUCT.id);
  $("adminTplPageName").value = normalizeTemplatePageName(next.pageName);
  $("adminTplImageFit").value = normalizeImageFit(next.templateImageFit);
  state.templatePreviewUrl = "";
  state.bleedPreviewUrl = "";
  state.safePreviewUrl = "";
  applyTemplateGeometry(next);
  resizeRulers();
  validateAll();
  syncAdminTemplatePageOptions(next.id);
});

$("adminTplProduct").addEventListener("change", (e) => {
  const pid = (e.target.value || state.productId || DEFAULT_PRODUCT.id).trim() || DEFAULT_PRODUCT.id;
  const currentGroup = ($("adminTplPageGroup").value || "").trim();
  if(!currentGroup){
    const id = ($("adminTplId").value || "").trim();
    const baseId = (id || "template").replace(/_p\d+$/i, "");
    $("adminTplPageGroup").value = `${pid}:${baseId}`;
  }
  syncAdminTemplatePageOptions();
});

$("adminTplPageGroup").addEventListener("input", () => {
  syncAdminTemplatePageOptions();
});

$("loadTemplatePageBtn").addEventListener("click", () => {
  const pageId = ($("adminTplPageSelect").value || "").trim();
  if(!pageId){
    alert("불러올 저장된 페이지를 선택하세요.");
    return;
  }
  const tpl = templates.find((x) => x.id === pageId);
  if(!tpl){
    alert("선택한 페이지 템플릿을 찾을 수 없습니다.");
    return;
  }
  applyTemplateToAdminEditor(tpl);
});

function renderAdminTemplateList(){
  const list = $("adminTemplateList");
  list.innerHTML = "";
  templates.forEach((tpl) => {
    const card = document.createElement("div");
    card.className = "assetCard";

    const title = document.createElement("div");
    title.className = "assetTitle";
    title.textContent = `${tpl.name} [${normalizeTemplatePageName(tpl.pageName)}]`;

    const productName = products.find((p) => p.id === (tpl.productId || DEFAULT_PRODUCT.id))?.name || "기본 상품";
    const pageName = normalizeTemplatePageName(tpl.pageName);
    const pageGroup = normalizeTemplatePageGroup(tpl.pageGroup, tpl.productId || DEFAULT_PRODUCT.id);
    const imageTag = tpl.templateImageUrl ? ` / 배경:${tpl.templateImageName || "등록됨"} (${normalizeImageFit(tpl.templateImageFit)})` : " / 배경:없음";
    const bleedTag = tpl.bleedImageUrl ? ` / Bleed:${tpl.bleedImageName || "등록됨"}` : " / Bleed:없음";
    const safeTag = tpl.safeImageUrl ? ` / Safe:${tpl.safeImageName || "등록됨"}` : " / Safe:없음";
    const meta = document.createElement("div");
    meta.className = "assetMeta";
    meta.textContent = `${tpl.id} / 상품:${productName} / 페이지:${pageName} / 그룹:${pageGroup} / ${tpl.mm.w}×${tpl.mm.h}mm / bleed ${tpl.bleed_mm} / safe ${tpl.safe_mm} / ${tpl.export.dpi}dpi${imageTag}${bleedTag}${safeTag}`;

    const actions = document.createElement("div");
    actions.className = "assetActions";

    const useBtn = document.createElement("button");
    useBtn.className = "btn2";
    useBtn.type = "button";
    useBtn.dataset.action = "use";
    useBtn.dataset.id = tpl.id;
    useBtn.textContent = "사용";

    const delBtn = document.createElement("button");
    delBtn.className = "btn2";
    delBtn.type = "button";
    delBtn.dataset.action = "delete";
    delBtn.dataset.id = tpl.id;
    delBtn.textContent = "삭제";

    actions.append(useBtn, delBtn);
    card.append(title, meta, actions);
    list.appendChild(card);
  });
}

function syncAdminTemplatePageOptions(selectedTemplateId){
  const select = $("adminTplPageSelect");
  if(!select) return;
  const productId = ($("adminTplProduct").value || state.productId || DEFAULT_PRODUCT.id).trim() || DEFAULT_PRODUCT.id;
  const rawGroup = ($("adminTplPageGroup").value || "").trim();
  const derivedGroup = normalizeTemplatePageGroup(rawGroup, productId);
  if(!rawGroup) $("adminTplPageGroup").value = derivedGroup;

  const pages = getTemplatesForPageGroup(productId, derivedGroup)
    .sort((a, b) => normalizeTemplatePageName(a.pageName).localeCompare(normalizeTemplatePageName(b.pageName), "ko"));

  select.innerHTML = "";
  const draftOpt = document.createElement("option");
  draftOpt.value = "";
  draftOpt.textContent = "현재 입력(미저장)";
  select.appendChild(draftOpt);

  pages.forEach((tpl) => {
    const opt = document.createElement("option");
    opt.value = tpl.id;
    opt.textContent = `${normalizeTemplatePageName(tpl.pageName)} (${tpl.id})`;
    select.appendChild(opt);
  });

  if(selectedTemplateId && pages.some((tpl) => tpl.id === selectedTemplateId)){
    select.value = selectedTemplateId;
  } else {
    select.value = "";
  }
}

function applyTemplateToAdminEditor(tpl){
  if(!tpl) return;
  state.productId = tpl.productId || DEFAULT_PRODUCT.id;
  $("product").value = state.productId;
  $("template").value = tpl.id;
  $("adminTplId").value = tpl.id;
  $("adminTplName").value = tpl.name;
  $("adminTplProduct").value = tpl.productId || DEFAULT_PRODUCT.id;
  $("adminTplPageGroup").value = normalizeTemplatePageGroup(tpl.pageGroup, tpl.productId || DEFAULT_PRODUCT.id);
  $("adminTplPageName").value = normalizeTemplatePageName(tpl.pageName);
  $("adminTplW").value = String(tpl.mm.w);
  $("adminTplH").value = String(tpl.mm.h);
  $("adminTplBleed").value = String(tpl.bleed_mm);
  $("adminTplSafe").value = String(tpl.safe_mm);
  $("adminTplDpi").value = String(tpl.export.dpi);
  $("adminTplImageFit").value = normalizeImageFit(tpl.templateImageFit);
  const infoParts = [];
  if(tpl.templateImageUrl) infoParts.push(`배경:${tpl.templateImageName || "등록됨"}`);
  if(tpl.bleedImageUrl) infoParts.push(`Bleed:${tpl.bleedImageName || "등록됨"}`);
  if(tpl.safeImageUrl) infoParts.push(`Safe:${tpl.safeImageName || "등록됨"}`);
  $("adminTplImageInfo").textContent = infoParts.length
    ? `기존 이미지 - ${infoParts.join(" / ")}`
    : "PNG 파일을 선택하면 드로잉창에서 바로 미리볼 수 있습니다.";
  pendingAdminTemplateFile = null;
  pendingAdminBleedFile = null;
  pendingAdminSafeFile = null;
  $("adminTplImageFile").value = "";
  $("adminTplBleedImageFile").value = "";
  $("adminTplSafeImageFile").value = "";
  state.templatePreviewUrl = "";
  state.bleedPreviewUrl = "";
  state.safePreviewUrl = "";
  applyTemplateGeometry(tpl);
  resizeRulers();
  renderAssetList();
  validateAll();
  syncAdminTemplatePageOptions(tpl.id);
}

async function refreshTemplateData(){
  templates = await fetchTemplates();
  if(!templates.length) templates = [DEFAULT_TEMPLATE];
  saveTemplatesLocal(templates);
  renderTemplateSelect();
  renderAdminTemplateList();
  syncAdminTemplatePageOptions(currentTemplate?.id || "");
}

$("addProductBtn").addEventListener("click", async () => {
  const id = ($("adminProductId").value || "").trim();
  const name = ($("adminProductName").value || "").trim();
  const category = ($("adminProductCategory").value || DEFAULT_PRODUCT.category).trim() || DEFAULT_PRODUCT.category;
  const subcategory = ($("adminProductSubcategory").value || "").trim();
  const canvasMode = $("adminProductCanvasMode").value || "fit";
  const makeTypeRaw = ($("adminProductMakeTypeInput").value || "").trim();
  const makeTypeList = normalizeMakeTypeList(makeTypeRaw.split(","));
  const defaultAssetId = ($("adminProductDefaultAsset").value || "").trim();

  if(!id || !name){
    alert("상품 ID와 이름을 입력하세요.");
    return;
  }
  if(makeTypeRaw && !makeTypeList.length){
    alert("제작방식은 쉼표로 구분해 최소 1개 이상 입력하세요.");
    return;
  }
  if(defaultAssetId){
    const selectedAsset = assets.find((x) => x.id === defaultAssetId && (x.productId || DEFAULT_PRODUCT.id) === id);
    if(!selectedAsset){
      alert("기본 배경 이미지는 해당 상품에 등록된 에셋만 선택할 수 있습니다.");
      return;
    }
  }

  const prev = products.find((x) => x.id === id);
  const product = {
    id,
    name,
    canvasMode,
    category,
    basePrice: Number(prev?.basePrice || 0),
    isPublished: prev?.isPublished !== false
  };
  try {
    {
      const raw = safeJsonParse(localStorage.getItem(CMS_DELETED_CATEGORIES_KEY), []);
      const nextDeleted = Array.isArray(raw)
        ? raw.filter((x) => String(x || "").trim() !== category)
        : [];
      localStorage.setItem(CMS_DELETED_CATEGORIES_KEY, JSON.stringify(nextDeleted));
    }
    if(!productCategories.includes(category)){
      productCategories = normalizeCategoryList([...productCategories, category]);
      saveProductCategories(productCategories);
    }
    await upsertProduct(product);
    if(makeTypeList.length){
      productMakeTypes[id] = makeTypeList;
    } else if(!productMakeTypes[id]){
      productMakeTypes[id] = [...DEFAULT_MAKE_TYPES];
    }
    saveProductMakeTypes(productMakeTypes);

    if(defaultAssetId){
      productDefaultAssets[id] = defaultAssetId;
    } else {
      delete productDefaultAssets[id];
    }
    saveProductDefaultAssets(productDefaultAssets);

    {
      const metaMap = loadCmsProductMetaMap();
      const prevMeta = metaMap[id] && typeof metaMap[id] === "object" ? metaMap[id] : {};
      metaMap[id] = {
        ...prevMeta,
        category,
        subcategory
      };
      saveCmsProductMetaMap(metaMap);
    }

    await refreshProductData();
    $("product").value = id;
    state.productId = id;
    $("adminOptionProduct").value = id;
    $("adminDefaultProduct").value = id;
    renderTemplateSelect();
    renderAssetList();
    renderMakeTypeSelect();
    syncAdminMakeTypeInput();
    renderDefaultAssetSelect(id);
    syncAdminProductManageInputs(id);
    applyDefaultAssetForProduct(id, true);
    validateAll();
    notifyCatalogUpdated();
  } catch (err) {
    alert(`상품 저장 실패: ${err.message || err}`);
  }
});

$("adminAddCategoryBtn").addEventListener("click", () => {
  const input = $("adminProductCategoryInput");
  const next = String(input?.value || "").trim();
  if(!next){
    alert("추가할 카테고리명을 입력하세요.");
    return;
  }
  if(!productCategories.includes(next)){
    productCategories = normalizeCategoryList([...productCategories, next]);
    saveProductCategories(productCategories);
  }
  {
    const raw = safeJsonParse(localStorage.getItem(CMS_DELETED_CATEGORIES_KEY), []);
    const nextDeleted = Array.isArray(raw)
      ? raw.filter((x) => String(x || "").trim() !== next)
      : [];
    localStorage.setItem(CMS_DELETED_CATEGORIES_KEY, JSON.stringify(nextDeleted));
  }
  renderAdminProductCategorySelect(next);
  notifyCatalogUpdated();
  if(input) input.value = "";
});

$("adminProductCategoryInput").addEventListener("keydown", (e) => {
  if(e.key !== "Enter") return;
  e.preventDefault();
  $("adminAddCategoryBtn").click();
});

$("adminProductId").addEventListener("change", () => {
  syncAdminProductManageInputs(($("adminProductId").value || "").trim());
});

$("adminProductCategory").addEventListener("change", () => {
  const category = ($("adminProductCategory").value || "").trim() || DEFAULT_PRODUCT.category;
  renderAdminProductSubcategorySelect(category, "");
});

$("adminProductDefaultAsset").addEventListener("change", () => {
  const pid = ($("adminProductId").value || "").trim() || state.productId || DEFAULT_PRODUCT.id;
  const aid = ($("adminProductDefaultAsset").value || "").trim();
  if(!aid){
    $("adminDefaultInfo").textContent = "상품 선택 시 자동으로 배경 이미지가 적용됩니다.";
    return;
  }
  const list = getAssetsForProduct(pid);
  const hit = list.find((x) => x.id === aid);
  $("adminDefaultInfo").textContent = hit
    ? `저장 예정 기본 이미지: ${hit.title || hit.name}`
    : "상품 선택 시 자동으로 배경 이미지가 적용됩니다.";
});

$("adminOptionProduct").addEventListener("change", (e) => {
  const pid = e.target.value || state.productId || DEFAULT_PRODUCT.id;
  const values = getMakeTypesForProduct(pid);
  $("adminMakeTypeInput").value = values.join(", ");
});

$("saveMakeTypeBtn").addEventListener("click", () => {
  const pid = ($("adminOptionProduct").value || state.productId || DEFAULT_PRODUCT.id).trim();
  if(!pid){
    alert("대상 상품을 선택하세요.");
    return;
  }

  const raw = ($("adminMakeTypeInput").value || "").trim();
  const list = normalizeMakeTypeList(raw.split(","));
  if(!list.length){
    alert("최소 1개 이상의 제작방식을 입력하세요.");
    return;
  }

  productMakeTypes[pid] = list;
  saveProductMakeTypes(productMakeTypes);
  if(state.productId === pid){
    renderMakeTypeSelect();
    syncAdminMakeTypeInput();
    validateAll();
  }
  alert("상품별 제작방식 옵션 저장 완료");
});

$("adminDefaultProduct").addEventListener("change", (e) => {
  const pid = e.target.value || state.productId || DEFAULT_PRODUCT.id;
  renderDefaultAssetSelect(pid);
});

$("saveDefaultAssetBtn").addEventListener("click", () => {
  const pid = ($("adminDefaultProduct").value || state.productId || DEFAULT_PRODUCT.id).trim();
  const aid = ($("adminDefaultAsset").value || "").trim();
  if(!pid){
    alert("대상 상품을 선택하세요.");
    return;
  }
  if(!aid){
    alert("기본 이미지로 지정할 항목을 선택하세요.");
    return;
  }

  const asset = assets.find((x) => x.id === aid && (x.productId || DEFAULT_PRODUCT.id) === pid);
  if(!asset){
    alert("선택한 이미지가 해당 상품과 일치하지 않습니다.");
    return;
  }

  productDefaultAssets[pid] = aid;
  saveProductDefaultAssets(productDefaultAssets);
  renderDefaultAssetSelect(pid);
  if(state.productId === pid){
    applyDefaultAssetForProduct(pid, true);
    validateAll();
  }
  alert("상품 기본 배경 이미지 저장 완료");
});

$("clearDefaultAssetBtn").addEventListener("click", () => {
  const pid = ($("adminDefaultProduct").value || state.productId || DEFAULT_PRODUCT.id).trim();
  if(!pid) return;
  delete productDefaultAssets[pid];
  saveProductDefaultAssets(productDefaultAssets);
  renderDefaultAssetSelect(pid);
  alert("상품 기본 배경 이미지 해제 완료");
});

$("adminProductList").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if(!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if(action === "use"){
    state.productId = id;
    $("product").value = id;
    $("adminOptionProduct").value = id;
    $("adminDefaultProduct").value = id;
    syncAdminProductManageInputs(id);
    renderTemplateSelect();
    renderAssetList();
    renderMakeTypeSelect();
    syncAdminMakeTypeInput();
    renderDefaultAssetSelect(id);
    applyDefaultAssetForProduct(id, true);
    validateAll();
    return;
  }

  if(action === "delete"){
    if(products.length <= 1){
      alert("최소 1개의 상품은 유지되어야 합니다.");
      return;
    }

    const hasTemplate = templates.some((t) => (t.productId || DEFAULT_PRODUCT.id) === id);
    if(hasTemplate){
      alert("이 상품에 연결된 템플릿이 있어 삭제할 수 없습니다. 템플릿을 먼저 삭제하세요.");
      return;
    }

    try {
      await removeProductById(id);
      delete productMakeTypes[id];
      delete productDefaultAssets[id];
      saveProductMakeTypes(productMakeTypes);
      saveProductDefaultAssets(productDefaultAssets);
      await refreshProductData();
      renderTemplateSelect();
      renderAssetList();
      validateAll();
      notifyCatalogUpdated();
    } catch (err) {
      alert(`상품 삭제 실패: ${err.message || err}`);
    }
  }
});

$("adminTplImageFile").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if(!file){
    pendingAdminTemplateFile = null;
    $("adminTplImageInfo").textContent = "PNG 파일을 선택하면 드로잉창에서 바로 미리볼 수 있습니다.";
    return;
  }
  const errMsg = validateTemplatePngFile(file, "템플릿 배경 이미지");
  if(errMsg){
    pendingAdminTemplateFile = null;
    e.target.value = "";
    $("adminTplImageInfo").textContent = errMsg;
    return;
  }
  pendingAdminTemplateFile = file;
  $("adminTplImageInfo").textContent = `배경: ${file.name} (${Math.round(file.size / 1024)}KB)`;
});

$("adminTplBleedImageFile").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if(!file){
    pendingAdminBleedFile = null;
    $("adminTplImageInfo").textContent = "PNG 파일을 선택하면 드로잉창에서 바로 미리볼 수 있습니다.";
    return;
  }
  const errMsg = validateTemplatePngFile(file, "Bleed 가이드 이미지");
  if(errMsg){
    pendingAdminBleedFile = null;
    e.target.value = "";
    $("adminTplImageInfo").textContent = errMsg;
    return;
  }
  pendingAdminBleedFile = file;
  $("adminTplImageInfo").textContent = `Bleed: ${file.name} (${Math.round(file.size / 1024)}KB)`;
});

$("adminTplSafeImageFile").addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if(!file){
    pendingAdminSafeFile = null;
    $("adminTplImageInfo").textContent = "PNG 파일을 선택하면 드로잉창에서 바로 미리볼 수 있습니다.";
    return;
  }
  const errMsg = validateTemplatePngFile(file, "Safe 가이드 이미지");
  if(errMsg){
    pendingAdminSafeFile = null;
    e.target.value = "";
    $("adminTplImageInfo").textContent = errMsg;
    return;
  }
  pendingAdminSafeFile = file;
  $("adminTplImageInfo").textContent = `Safe: ${file.name} (${Math.round(file.size / 1024)}KB)`;
});

$("previewTemplateBtn").addEventListener("click", () => {
  const w = Number($("adminTplW").value || 0);
  const h = Number($("adminTplH").value || 0);
  const bleed = Number($("adminTplBleed").value || 0);
  const safe = Number($("adminTplSafe").value || 0);
  const outDpi = Number($("adminTplDpi").value || 0);
  const fit = $("adminTplImageFit").value || "cover";
  const name = ($("adminTplName").value || "미리보기 템플릿").trim();

  if(!(w >= 10 && h >= 10 && outDpi >= 72)){ alert("미리보기 전에 가로/세로(mm), DPI 값을 확인하세요."); return; }
  if(bleed < 0 || safe < 0){ alert("Bleed/Safe는 0 이상이어야 합니다."); return; }

  currentTemplate = {
    ...currentTemplate,
    name,
    mm: { w, h },
    bleed_mm: bleed,
    safe_mm: safe,
    export: { dpi: outDpi },
    templateImageFit: normalizeImageFit(fit)
  };

  Promise.all([
    pendingAdminTemplateFile ? readFileAsDataUrl(pendingAdminTemplateFile) : Promise.resolve(""),
    pendingAdminBleedFile ? readFileAsDataUrl(pendingAdminBleedFile) : Promise.resolve(""),
    pendingAdminSafeFile ? readFileAsDataUrl(pendingAdminSafeFile) : Promise.resolve("")
  ]).then(([tplUrl, bleedUrl, safeUrl]) => {
    state.templatePreviewUrl = tplUrl || "";
    state.bleedPreviewUrl = bleedUrl || "";
    state.safePreviewUrl = safeUrl || "";
    applyTemplateGeometry(currentTemplate);
    resizeRulers();
    validateAll();
  }).catch((err) => {
    alert(`템플릿 미리보기 실패: ${err.message || err}`);
  });
});

$("addTemplateBtn").addEventListener("click", async () => {
  const id = ($("adminTplId").value || "").trim();
  const name = ($("adminTplName").value || "").trim();
  const productId = ($("adminTplProduct").value || "").trim();
  const pageGroupInput = ($("adminTplPageGroup").value || "").trim();
  const pageNameInput = ($("adminTplPageName").value || "").trim();
  const w = Number($("adminTplW").value || 0);
  const h = Number($("adminTplH").value || 0);
  const bleed = Number($("adminTplBleed").value || 0);
  const safe = Number($("adminTplSafe").value || 0);
  const outDpi = Number($("adminTplDpi").value || 0);
  const fit = $("adminTplImageFit").value || "cover";
  const baseIdForGroup = id.replace(/_p\d+$/i, "") || id;
  const pageGroup = pageGroupInput || `${productId}:${baseIdForGroup}`;
  const pageName = normalizeTemplatePageName(pageNameInput);

  if(!id || !name){ alert("템플릿 ID와 이름을 입력하세요."); return; }
  if(!productId){ alert("대상 상품을 선택하세요."); return; }
  if(!pageName){ alert("페이지 이름을 입력하세요."); return; }
  $("adminTplPageGroup").value = pageGroup;
  if(!(w >= 10 && h >= 10 && outDpi >= 72)){ alert("가로/세로(mm), DPI 값을 확인하세요."); return; }
  if(bleed < 0 || safe < 0){ alert("Bleed/Safe는 0 이상이어야 합니다."); return; }

  const exists = templates.find((t) => t.id === id);
  let templateImageUrl = exists?.templateImageUrl || "";
  let templateImagePath = exists?.templateImagePath || null;
  let templateImageName = exists?.templateImageName || "";
  let bleedImageUrl = exists?.bleedImageUrl || "";
  let bleedImagePath = exists?.bleedImagePath || null;
  let bleedImageName = exists?.bleedImageName || "";
  let safeImageUrl = exists?.safeImageUrl || "";
  let safeImagePath = exists?.safeImagePath || null;
  let safeImageName = exists?.safeImageName || "";

  try {
    if(pendingAdminTemplateFile){
      const uploaded = await addTemplateImageFromFile(pendingAdminTemplateFile, id, "base");
      templateImageUrl = uploaded.url || "";
      templateImagePath = uploaded.storagePath || null;
      templateImageName = uploaded.name || pendingAdminTemplateFile.name;
      if(!templateImageUrl){
        throw new Error("배경 이미지 URL 생성 실패");
      }
    }
  } catch (err) {
    alert(`템플릿 배경 이미지 업로드 실패: ${parseSbError(err, "알 수 없는 오류")}`);
    return;
  }

  try {
    if(pendingAdminBleedFile){
      const uploaded = await addTemplateImageFromFile(pendingAdminBleedFile, id, "bleed");
      bleedImageUrl = uploaded.url || "";
      bleedImagePath = uploaded.storagePath || null;
      bleedImageName = uploaded.name || pendingAdminBleedFile.name;
    }
  } catch (err) {
    alert(`Bleed 가이드 이미지 업로드 실패(템플릿 저장은 계속 진행): ${parseSbError(err, "알 수 없는 오류")}`);
  }

  try {
    if(pendingAdminSafeFile){
      const uploaded = await addTemplateImageFromFile(pendingAdminSafeFile, id, "safe");
      safeImageUrl = uploaded.url || "";
      safeImagePath = uploaded.storagePath || null;
      safeImageName = uploaded.name || pendingAdminSafeFile.name;
    }
  } catch (err) {
    alert(`Safe 가이드 이미지 업로드 실패(템플릿 저장은 계속 진행): ${parseSbError(err, "알 수 없는 오류")}`);
  }

  const tpl = {
    id,
    name,
    productId,
    pageGroup,
    pageName,
    mm: { w, h },
    bleed_mm: bleed,
    safe_mm: safe,
    export: { dpi: outDpi },
    templateImageUrl,
    templateImagePath,
    templateImageName,
    templateImageFit: normalizeImageFit(fit),
    bleedImageUrl,
    bleedImagePath,
    bleedImageName,
    safeImageUrl,
    safeImagePath,
    safeImageName
  };

  try {
    await upsertTemplate(tpl);
    await refreshTemplateData();
    state.productId = productId;
    $("product").value = productId;
    $("template").value = id;
    state.templatePreviewUrl = "";
    state.bleedPreviewUrl = "";
    state.safePreviewUrl = "";
    pendingAdminTemplateFile = null;
    pendingAdminBleedFile = null;
    pendingAdminSafeFile = null;
    $("adminTplImageFile").value = "";
    $("adminTplBleedImageFile").value = "";
    $("adminTplSafeImageFile").value = "";
    $("adminTplImageInfo").textContent = "PNG 파일을 선택하면 드로잉창에서 바로 미리볼 수 있습니다.";
    syncAdminTemplatePageOptions(id);
    applyTemplateGeometry(tpl);
    resizeRulers();
    renderAssetList();
    validateAll();
    notifyCatalogUpdated();
  } catch (err) {
    alert(`템플릿 저장 실패: ${parseSbError(err, "알 수 없는 오류")}`);
  }
});

$("loadTemplateBtn").addEventListener("click", async () => {
  try {
    state.templatePreviewUrl = "";
    state.bleedPreviewUrl = "";
    state.safePreviewUrl = "";
    pendingAdminTemplateFile = null;
    pendingAdminBleedFile = null;
    pendingAdminSafeFile = null;
    $("adminTplImageFile").value = "";
    $("adminTplBleedImageFile").value = "";
    $("adminTplSafeImageFile").value = "";
    await refreshProductData();
    await refreshTemplateData();
    alert(`템플릿 불러오기 완료 (source: ${useSupabase ? "SUPABASE" : "LOCAL"})`);
  } catch (err) {
    alert(`템플릿 불러오기 실패: ${err.message || err}`);
  }
});

$("adminTemplateList").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if(!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if(action === "use"){
    const tpl = templates.find((x) => x.id === id);
    if(!tpl) return;
    applyTemplateToAdminEditor(tpl);
    return;
  }

  if(action === "delete"){
    if(templates.length === 1){
      alert("최소 1개의 템플릿은 유지되어야 합니다.");
      return;
    }
    try {
      await removeTemplateById(id);
      await refreshTemplateData();
      notifyCatalogUpdated();
    } catch (err) {
      alert(`템플릿 삭제 실패: ${err.message || err}`);
    }
  }
});

function renderAssetList(){
  const list = $("assetList");
  list.innerHTML = "";
  const filtered = getAssetsForCurrentProduct();

  if(!filtered.length){
    const msg = document.createElement("div");
    msg.className = "hint";
    msg.textContent = "선택한 상품에 등록된 이미지가 없습니다. 직접 업로드를 사용하세요.";
    list.appendChild(msg);
    return;
  }

  filtered.forEach((asset) => {
    const card = document.createElement("div");
    card.className = "assetCard" + (state.selectedAssetId === asset.id ? " selected" : "");
    card.dataset.id = asset.id;

    const thumb = document.createElement("img");
    thumb.className = "assetThumb";
    thumb.src = asset.previewUrl;
    thumb.alt = asset.title || asset.name;

    const title = document.createElement("div");
    title.className = "assetTitle";
    title.textContent = asset.title || asset.name;

    const meta = document.createElement("div");
    meta.className = "assetMeta";
    meta.textContent = `${Math.round((asset.size || 0) / 1024)}KB`;

    card.append(thumb, title, meta);
    list.appendChild(card);
  });
}

function renderAdminImageList(){
  const list = $("adminImageList");
  list.innerHTML = "";

  if(!assets.length){
    const msg = document.createElement("div");
    msg.className = "hint";
    msg.textContent = "등록된 이미지가 없습니다.";
    list.appendChild(msg);
    return;
  }

  assets.forEach((asset) => {
    const card = document.createElement("div");
    card.className = "assetCard";

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "10px";
    row.style.alignItems = "center";

    const thumb = document.createElement("img");
    thumb.className = "assetThumb";
    thumb.src = asset.previewUrl;
    thumb.alt = asset.title || asset.name;
    thumb.style.width = "64px";
    thumb.style.aspectRatio = "1 / 1";
    thumb.style.flex = "0 0 auto";

    const info = document.createElement("div");
    info.style.minWidth = "0";
    info.style.flex = "1";

    const title = document.createElement("div");
    title.className = "assetTitle";
    title.style.marginTop = "0";
    title.textContent = asset.title || asset.name;

    const productName = products.find((p) => p.id === (asset.productId || DEFAULT_PRODUCT.id))?.name || "기본 상품";
    const meta = document.createElement("div");
    meta.className = "assetMeta";
    meta.textContent = `${asset.name} / ${Math.round((asset.size || 0) / 1024)}KB / 상품:${productName}`;

    info.append(title, meta);
    row.append(thumb, info);

    const actions = document.createElement("div");
    actions.className = "assetActions";

    const delBtn = document.createElement("button");
    delBtn.className = "btn2";
    delBtn.type = "button";
    delBtn.dataset.action = "delete";
    delBtn.dataset.id = asset.id;
    delBtn.textContent = "삭제";

    actions.appendChild(delBtn);
    card.append(row, actions);
    list.appendChild(card);
  });
}

async function refreshAssetData(){
  assets = await fetchAssets();
  saveAssetsLocal(assets);
  renderAssetList();
  renderAdminImageList();
  renderDefaultAssetSelect($("adminDefaultProduct").value || state.productId || DEFAULT_PRODUCT.id);
  renderAdminProductInlineDefaultAssetSelect($("adminProductId").value || state.productId || DEFAULT_PRODUCT.id);
}

function setImageSource(src, meta){
  const layer = makeImageLayerFromSource(src, meta);
  const probe = new Image();
  probe.onload = () => {
    const cur = getImageLayerById(layer.id);
    if(!cur) return;
    const nw = probe.naturalWidth || 1200;
    const nh = probe.naturalHeight || 800;
    cur.aspect = nh / nw;
    cur.baseW = 360;
    cur.baseH = Math.max(20, Math.round(cur.baseW * cur.aspect));
    cur.w = cur.baseW;
    cur.h = cur.baseH;
    cur.x = 0;
    cur.y = 0;
    if(state.activeLayerId === cur.id){
      syncLegacyImageStateFromActiveLayer();
      const z = Math.round((state.img.w / Math.max(1, state.img.baseW || state.img.w)) * 100);
      $("zoom").value = String(clamp(z, Number($("zoom").min || 30), Number($("zoom").max || 300)));
      $("zoomVal").textContent = $("zoom").value;
    }
    renderImageLayers();
    renderLayerList();
    validateAll();
  };
  probe.src = src;

  renderImageLayers();
  renderLayerList();
  setSelected("img");
  validateAll();
}

function clearSelectedImage(){
  removeActiveLayer();
  $("file").value = "";
  renderAssetList();
  renderLayerList();
  validateAll();
}

$("assetList").addEventListener("click", (e) => {
  const card = e.target.closest(".assetCard[data-id]");
  if(!card) return;
  const asset = getAssetsForCurrentProduct().find((a) => a.id === card.dataset.id);
  if(!asset) return;

  state.selectedAssetId = asset.id;
  $("file").value = "";
  setImageSource(asset.previewUrl, {
    source: "library",
    assetId: asset.id,
    productId: asset.productId || DEFAULT_PRODUCT.id,
    title: asset.title || "",
    name: asset.name,
    size: asset.size,
    type: asset.type
  });
  renderAssetList();
});

$("clearImageSelect").addEventListener("click", clearSelectedImage);

$("layerList").addEventListener("click", (e) => {
  const row = e.target.closest("[data-layer-id]");
  if(!row) return;
  const id = row.dataset.layerId;
  const actionBtn = e.target.closest("button[data-action][data-id]");

  if(!actionBtn){
    setActiveLayerById(id);
    return;
  }

  const action = actionBtn.dataset.action;
  const layer = getImageLayerById(actionBtn.dataset.id);
  if(!layer) return;

  if(action === "toggleVisible"){
    layer.visible = !layer.visible;
  } else if(action === "toggleLock"){
    layer.locked = !layer.locked;
  }

  if(state.activeLayerId === layer.id){
    syncLegacyImageStateFromActiveLayer();
  }

  renderImageLayers();
  renderLayerList();
  validateAll();
});

$("layerUpBtn").addEventListener("click", () => { moveActiveLayer("up"); queueHistoryCheckpoint(); });
$("layerDownBtn").addEventListener("click", () => { moveActiveLayer("down"); queueHistoryCheckpoint(); });
$("layerDuplicateBtn").addEventListener("click", () => { duplicateActiveLayer(); queueHistoryCheckpoint(); });
$("layerDeleteBtn").addEventListener("click", () => { removeActiveLayer(); queueHistoryCheckpoint(); });

$("layerOpacity").addEventListener("input", (e) => {
  const layer = getActiveImageLayer();
  if(!layer) return;
  layer.opacity = clamp(Number(e.target.value || 100) / 100, 0, 1);
  syncLegacyImageStateFromActiveLayer();
  applyImgTransform();
  renderLayerList();
  validateAll();
});

$("layerBlend").addEventListener("change", (e) => {
  const layer = getActiveImageLayer();
  if(!layer) return;
  layer.blendMode = e.target.value || "normal";
  syncLegacyImageStateFromActiveLayer();
  applyImgTransform();
  renderLayerList();
  validateAll();
});

const layerSearchEl = $("layerSearch");
if(layerSearchEl){
  layerSearchEl.addEventListener("input", () => {
    renderLayerList();
  });
}

$("adminImageList").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action='delete']");
  if(!btn) return;
  const id = btn.dataset.id;
  const asset = assets.find((x) => x.id === id);
  if(!asset) return;

  try {
    await removeAsset(asset);
    Object.keys(productDefaultAssets).forEach((pid) => {
      if(productDefaultAssets[pid] === asset.id) delete productDefaultAssets[pid];
    });
    saveProductDefaultAssets(productDefaultAssets);
    const remain = state.imageLayers.filter((x) => x.assetId !== id);
    state.imageLayers = remain;
    if(!state.imageLayers.some((x) => x.id === state.activeLayerId)){
      state.activeLayerId = state.imageLayers[state.imageLayers.length - 1]?.id || null;
    }
    syncLegacyImageStateFromActiveLayer();
    renderImageLayers();
    renderLayerList();
    await refreshAssetData();
    renderDefaultAssetSelect($("adminDefaultProduct").value || state.productId || DEFAULT_PRODUCT.id);
  } catch (err) {
    alert(`이미지 삭제 실패: ${err.message || err}`);
  }
});

$("adminImageFile").addEventListener("change", (e) => {
  const files = Array.from(e.target.files || []);
  pendingAdminAssetFiles = files.filter((f) => f.type.startsWith("image/") && f.size <= 12 * 1024 * 1024);
  $("adminImagePickInfo").textContent = pendingAdminAssetFiles.length
    ? `${pendingAdminAssetFiles.length}개 파일 선택됨. '이미지 저장'을 눌러 등록하세요.`
    : "선택 가능한 이미지 파일이 없습니다. (형식: image/*, 크기: 12MB 이하)";
});

$("uploadAssetBtn").addEventListener("click", async () => {
  if(!pendingAdminAssetFiles.length){
    alert("저장할 이미지를 먼저 선택하세요.");
    return;
  }
  const titleBase = ($("adminImageTitle").value || "").trim();
  const productId = ($("adminImageProduct").value || state.productId || DEFAULT_PRODUCT.id).trim() || DEFAULT_PRODUCT.id;

  try {
    for(const f of pendingAdminAssetFiles){
      const added = await addAssetFromFile(f, titleBase || f.name, productId);
      assets.unshift(added);
    }

    saveAssetsLocal(assets);
    pendingAdminAssetFiles = [];
    $("adminImageFile").value = "";
    $("adminImageTitle").value = "";
    $("adminImagePickInfo").textContent = "파일 선택 후 '이미지 저장'을 누르면 등록됩니다.";
    await refreshAssetData();
    alert(`이미지 저장 완료 (source: ${useSupabase ? "SUPABASE" : "LOCAL"})`);
  } catch (err) {
    alert(`이미지 업로드 실패: ${err.message || err}`);
  }
});

$("loadAssetBtn").addEventListener("click", async () => {
  try {
    await refreshAssetData();
    alert(`이미지 불러오기 완료 (source: ${useSupabase ? "SUPABASE" : "LOCAL"})`);
  } catch (err) {
    alert(`이미지 불러오기 실패: ${err.message || err}`);
  }
});

$("file").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  if(!files.length) return;

  const valid = [];
  for(const f of files){
    if(!f.type.startsWith("image/")) continue;
    if(f.size > 12 * 1024 * 1024) continue;
    valid.push(f);
  }
  if(!valid.length){
    alert("선택한 파일 중 업로드 가능한 이미지가 없습니다. (image/*, 12MB 이하)");
    e.target.value = "";
    return;
  }

  state.selectedAssetId = null;
  for(const f of valid){
    const src = await readFileAsDataUrl(f);
    setImageSource(src, {
      source: "upload",
      productId: state.productId || DEFAULT_PRODUCT.id,
      name: f.name,
      size: f.size,
      type: f.type
    });
  }
  renderAssetList();
  e.target.value = "";
});

function makeDraggable(el, getSet, onStart){
  let dragging = false;
  let startX = 0, startY = 0, baseX = 0, baseY = 0;

  const getXY = (evt) => evt.touches && evt.touches[0]
    ? {x:evt.touches[0].clientX, y:evt.touches[0].clientY}
    : {x:evt.clientX, y:evt.clientY};

  const down = (evt) => {
    if(resizing) return;
    dragging = true;
    const p = getXY(evt);
    startX = p.x; startY = p.y;
    const cur = getSet.get();
    baseX = cur.x; baseY = cur.y;
    onStart && onStart();
    evt.preventDefault();
  };

  const move = (evt) => {
    if(!dragging) return;
    const p = getXY(evt);
    getSet.set(baseX + (p.x - startX), baseY + (p.y - startY));
    evt.preventDefault();
  };

  const up = () => { dragging = false; validateAll(); updateTBox(); };

  el.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  el.addEventListener("touchstart", down, {passive:false});
  window.addEventListener("touchmove", move, {passive:false});
  window.addEventListener("touchend", up);
}

function applyImgTransform(){
  const layer = getActiveImageLayer();
  if(!layer){
    updateTBox();
    return;
  }
  layer.x = state.img.x;
  layer.y = state.img.y;
  layer.w = state.img.w;
  layer.h = state.img.h;
  layer.baseW = state.img.baseW;
  layer.baseH = state.img.baseH;
  layer.aspect = state.img.aspect;
  const el = getActiveImageLayerEl();
  applyLayerStyle(layer, el);
  updateTBox();
}

function applyTextTransform(){
  const t = $("txtLayer");
  t.style.background = "transparent";
  t.style.border = "none";
  t.style.boxShadow = "none";
  t.style.padding = "0";
  t.style.borderRadius = "0";
  t.style.fontSize = state.txt.size + "px";
  t.style.transform = `translate(calc(-50% + ${state.txt.x}px), calc(-50% + ${state.txt.y}px))`;
  updateTBox();
}

makeDraggable($("txtLayer"), { get:() => ({x:state.txt.x, y:state.txt.y}), set:(x, y) => { state.txt.x = x; state.txt.y = y; applyTextTransform(); } }, () => setSelected("text"));

function getRects(){
  const wr = work.getBoundingClientRect();
  const fr = frame.getBoundingClientRect();
  return { wr, fr, workCenterX: wr.left + wr.width / 2, workCenterY: wr.top + wr.height / 2 };
}

function setSelectedOffset(which, x, y){
  if(which === "img"){
    const layer = getActiveImageLayer();
    if(!layer || layer.locked) return;
    state.img.x = x;
    state.img.y = y;
    applyImgTransform();
  }
  if(which === "text"){ state.txt.x = x; state.txt.y = y; applyTextTransform(); }
  validateAll();
}

function alignToFrame(mode){
  const el = getSelectedEl();
  if(!el || !state.selected) return;

  const {fr, workCenterX, workCenterY} = getRects();
  const r = el.getBoundingClientRect();

  const frameL = fr.left, frameT = fr.top, frameR = fr.right, frameB = fr.bottom;
  const elW = r.width, elH = r.height;

  let targetCX = r.left + elW / 2;
  let targetCY = r.top + elH / 2;

  if(mode === "left") targetCX = frameL + elW / 2;
  if(mode === "center") targetCX = (frameL + frameR) / 2;
  if(mode === "right") targetCX = frameR - elW / 2;
  if(mode === "top") targetCY = frameT + elH / 2;
  if(mode === "middle") targetCY = (frameT + frameB) / 2;
  if(mode === "bottom") targetCY = frameB - elH / 2;

  setSelectedOffset(state.selected, targetCX - workCenterX, targetCY - workCenterY);
}

$("alLeft").addEventListener("click", () => alignToFrame("left"));
$("alCenter").addEventListener("click", () => alignToFrame("center"));
$("alRight").addEventListener("click", () => alignToFrame("right"));
$("alTop").addEventListener("click", () => alignToFrame("top"));
$("alMiddle").addEventListener("click", () => alignToFrame("middle"));
$("alBottom").addEventListener("click", () => alignToFrame("bottom"));

function fitSelectedToSafe(){
  const which = state.selected;
  if(!which){
    alert("먼저 이미지 또는 문구 레이어를 선택하세요.");
    return;
  }
  const el = getSelectedEl();
  if(!el) return;
  const safe = $("safeBox").getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  if(!safe.width || !safe.height || !rect.width || !rect.height) return;

  const scale = Math.min(safe.width / rect.width, safe.height / rect.height) * 0.96;
  if(!Number.isFinite(scale) || scale <= 0) return;

  if(which === "img"){
    const active = getActiveImageLayer();
    if(!active || active.locked) return;
    state.img.w = Math.max(20, Math.round(state.img.w * scale));
    state.img.h = Math.max(20, Math.round(state.img.h * scale));
    const z = Math.round((state.img.w / Math.max(1, state.img.baseW || state.img.w)) * 100);
    $("zoom").value = String(clamp(z, Number($("zoom").min || 30), Number($("zoom").max || 300)));
    $("zoomVal").textContent = $("zoom").value;
    applyImgTransform();
  } else {
    const minSize = Number($("fontSize").min || 8);
    const maxSize = Number($("fontSize").max || 200);
    state.txt.size = clamp(Math.round(state.txt.size * scale), minSize, maxSize);
    $("fontSize").value = String(state.txt.size);
    $("fontVal").textContent = String(state.txt.size);
    applyTextTransform();
  }

  const safeCx = (safe.left + safe.right) / 2;
  const safeCy = (safe.top + safe.bottom) / 2;
  const { workCenterX, workCenterY } = getRects();
  setSelectedOffset(which, safeCx - workCenterX, safeCy - workCenterY);
  queueHistoryCheckpoint();
}

$("centerAll").addEventListener("click", () => {
  state.imageLayers.forEach((layer) => {
    layer.x = 0;
    layer.y = 0;
  });
  syncLegacyImageStateFromActiveLayer();
  state.txt.x = 0; state.txt.y = 0;
  applyImgTransform(); applyTextTransform();
  validateAll();
  queueHistoryCheckpoint();
});

$("reset").addEventListener("click", () => {
  $("orderType").value = ""; $("makeType").value = ""; $("qty").value = 1;
  $("textLine").value = ""; $("note").value = ""; $("file").value = "";
  $("count").textContent = "0";

  state.orderType = ""; state.makeType = ""; state.qty = 1; state.textLine = ""; state.note = "";
  state.image = null; state.selectedAssetId = null;
  state.imageLayers = [];
  state.activeLayerId = null;
  renderImageLayers();
  renderLayerList();
  state.img = { x:0, y:0, w:320, h:240, aspect:0.75, baseW:320, baseH:240 };
  $("zoom").value = 100; $("zoomVal").textContent = 100;

  state.txt = {x:0, y:0, size:26};
  $("fontSize").value = 26; $("fontVal").textContent = 26;
  $("txtLayer").textContent = "문구";

  applyImgTransform();
  applyTextTransform();
  $("groupNotice").style.display = "none";
  setSelected(null);
  renderAssetList();
  validateAll();
  queueHistoryCheckpoint();
});

$("fitSafe").addEventListener("click", fitSelectedToSafe);
$("undo").addEventListener("click", undoHistory);
$("redo").addEventListener("click", redoHistory);
$("shortcutsHelp").addEventListener("click", () => {
  alert(
    "단축키 안내\n\n" +
    "Ctrl/Cmd + Z: 실행취소\n" +
    "Ctrl/Cmd + Shift + Z: 다시실행\n" +
    "Ctrl/Cmd + Y: 다시실행\n" +
    "Ctrl/Cmd + S: 생산파일 생성\n" +
    "?: 단축키 안내"
  );
});

window.addEventListener("keydown", (e) => {
  const key = (e.key || "").toLowerCase();
  const mod = e.ctrlKey || e.metaKey;
  const target = e.target;
  const isTyping = !!target && (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );

  if(mod && key === "s"){
    e.preventDefault();
    $("export").click();
    return;
  }

  if(isTyping) return;

  if(mod && key === "z"){
    e.preventDefault();
    if(e.shiftKey) redoHistory();
    else undoHistory();
    return;
  }
  if(mod && key === "y"){
    e.preventDefault();
    redoHistory();
    return;
  }
  if(!mod && key === "?"){
    e.preventDefault();
    $("shortcutsHelp").click();
  }
});

function newJobId(){
  const s = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `LF-${new Date().toISOString().slice(0,10).replaceAll("-", "")}-${s}`;
}
$("jobId").textContent = newJobId();

function rectOutsideSafe(elRect, safeRect){
  return (elRect.left < safeRect.left || elRect.top < safeRect.top || elRect.right > safeRect.right || elRect.bottom > safeRect.bottom);
}

function validateAll(){
  const warnings = [];
  const errors = [];
  const currentProduct = getCurrentProduct();
  const currentProductTemplates = getTemplatesForCurrentProduct();
  const exportMetrics = resolveExportMetrics(currentTemplate);

  if(!state.productId) errors.push("상품을 선택하세요.");
  if(!currentProductTemplates.length) errors.push("선택한 상품에 연결된 템플릿이 없습니다. 관리자 모드에서 템플릿을 등록하세요.");
  if(!state.orderType) errors.push("주문유형(개인/단체)을 선택하세요.");
  if(!state.makeType) errors.push("제작방식(인쇄/반사/자수)을 선택하세요.");
  if(!state.qty || state.qty < 1) errors.push("수량은 1 이상이어야 합니다.");
  if(!state.imageLayers.length) errors.push("이미지를 업로드하거나 관리자 등록 이미지에서 선택하세요.");

  if(state.show.safe){
    const safe = $("safeBox").getBoundingClientRect();
    state.imageLayers.forEach((layer) => {
      if(!layer.visible) return;
      const el = work.querySelector(`.layer[data-layer-id="${layer.id}"]`);
      if(!el || el.style.display === "none") return;
      const r = el.getBoundingClientRect();
      if(rectOutsideSafe(r, safe)) warnings.push(`이미지 레이어 '${layer.name}'가 Safe 영역을 침범했습니다. (가장자리 잘림 위험)`);
    });
    if(state.show.text){
      const r = $("txtLayer").getBoundingClientRect();
      if(rectOutsideSafe(r, safe)) warnings.push("문구 레이어가 Safe 영역을 침범했습니다. (텍스트 잘림 위험)");
    }
  }

  state.imageLayers.forEach((layer) => {
    if(layer.size && layer.size < 250 * 1024){
      warnings.push(`레이어 '${layer.name}' 이미지 용량이 작습니다. 해상도가 낮을 수 있습니다.(권장: 1500px 이상)`);
    }
  });
  if(exportMetrics.downscaled){
    warnings.push(`대형 출력 안정성을 위해 DPI가 ${exportMetrics.requestedDpi} → ${exportMetrics.exportDpi}로 자동 조정됩니다.`);
  }

  const ok = errors.length === 0 && warnings.length === 0;
  const lines = [
    `상품: ${currentProduct.name}`,
    `템플릿: ${currentTemplate.name}`,
    `주문유형: ${state.orderType || "-"}`,
    `제작방식: ${state.makeType || "-"}`,
    `수량: ${state.qty || "-"}`,
    `문구: ${state.textLine ? state.textLine : "-"}`
  ];

  lines.push(`이미지 레이어: ${state.imageLayers.length}개`);
  const activeLayer = getActiveImageLayer();
  lines.push(`활성 레이어: ${activeLayer ? activeLayer.name : "-"}`);
  lines.push(`검증: ${ok ? "OK" : (errors.length ? "ERROR" : "WARN")}`);
  lines.push(`출력 해상도: ${exportMetrics.printW}×${exportMetrics.printH}px @ ${exportMetrics.exportDpi}dpi`);

  if(errors.length){ lines.push("\n[필수 오류]"); errors.forEach((x) => lines.push("- " + x)); }
  if(warnings.length){ lines.push("\n[경고]"); warnings.forEach((x) => lines.push("- " + x)); }

  $("summary").textContent = lines.join("\n");
  $("checkState").textContent = ok ? "OK" : (errors.length ? "ERROR" : "WARN");

  $("warnBox").style.display = (errors.length || warnings.length) ? "block" : "none";
  $("okBox").style.display = ok ? "block" : "none";

  if(errors.length){
    $("warnBox").innerHTML = "<b>생산 불가(필수 미입력)</b><br/>" + errors.map((e)=>`• ${e}`).join("<br/>");
  } else if(warnings.length){
    $("warnBox").innerHTML = "<b>주의(생산 전 조정 권장)</b><br/>" + warnings.map((w)=>`• ${w}`).join("<br/>");
  } else {
    $("warnBox").style.display = "none";
  }

  if(ok){
    $("okBox").innerHTML = "<b>✅ 생산 준비 완료</b><br/>템플릿 프레임 영역으로 PRINT/Preview를 생성합니다.";
  }

  updateTBox();
  queueHistoryCheckpoint();
  queueDraftSave();
  return { ok, errors, warnings };
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function canvasToBlobAsync(canvas, type, quality){
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if(!blob){
        reject(new Error(`Blob 생성 실패 (${type || "unknown"})`));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

function buildSpecObject(){
  const jobId = $("jobId").textContent;
  const metrics = resolveExportMetrics(currentTemplate);
  return {
    jobId,
    product: getCurrentProduct(),
    template: currentTemplate,
    order: { orderType: state.orderType, makeType: state.makeType, qty: state.qty },
    text: { line: state.textLine, sizePx: state.txt.size, pos: { x: state.txt.x, y: state.txt.y } },
    imageLayers: state.imageLayers.map((layer, z) => ({
      id: layer.id,
      zIndex: z,
      name: layer.name,
      source: layer.source,
      assetId: layer.assetId,
      productId: layer.productId || state.productId || DEFAULT_PRODUCT.id,
      title: layer.title,
      fileName: layer.fileName,
      size: layer.size,
      type: layer.type,
      visible: layer.visible !== false,
      locked: layer.locked === true,
      opacity: layer.opacity ?? 1,
      blendMode: layer.blendMode || "normal",
      pos: { x: layer.x, y: layer.y },
      sizePx: { w: layer.w, h: layer.h }
    })),
    activeLayerId: state.activeLayerId || null,
    note: state.note,
    export: {
      dpi: metrics.exportDpi,
      requestedDpi: metrics.requestedDpi,
      printPx: { w: metrics.printW, h: metrics.printH },
      autoDownscaled: metrics.downscaled
    },
    timestamp: new Date().toISOString()
  };
}

async function exportSpecBlob(){
  const spec = buildSpecObject();
  const blob = new Blob([JSON.stringify(spec, null, 2)], {type:"application/json"});
  return { blob, spec, filename: `${spec.jobId}_SPEC.json` };
}

async function exportSpec(){
  const { blob, filename } = await exportSpecBlob();
  downloadBlob(blob, filename);
}

async function renderFrameToCanvas(outW, outH){
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if(!ctx) throw new Error("Canvas 컨텍스트를 생성할 수 없습니다.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const scale = outW / frameW;

  const wr = work.getBoundingClientRect();
  const fr = frame.getBoundingClientRect();
  const frameLeft = fr.left - wr.left;
  const frameTop = fr.top - wr.top;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, outW, outH);

  const templateBgSrc = state.templatePreviewUrl || currentTemplate.templateImageUrl || "";
  if(templateBgSrc){
    const bg = new Image();
    bg.src = templateBgSrc;
    try {
      await bg.decode();
    } catch {
      await new Promise((resolve, reject) => {
        bg.onload = () => resolve();
        bg.onerror = () => reject(new Error("템플릿 배경 이미지 디코딩 실패"));
      });
    }

    const fit = normalizeImageFit(currentTemplate.templateImageFit);
    const iw = bg.naturalWidth || outW;
    const ih = bg.naturalHeight || outH;
    let dx = 0;
    let dy = 0;
    let dw = outW;
    let dh = outH;

    if(fit === "contain"){
      const ratio = Math.min(outW / iw, outH / ih);
      dw = Math.max(1, Math.round(iw * ratio));
      dh = Math.max(1, Math.round(ih * ratio));
      dx = Math.round((outW - dw) / 2);
      dy = Math.round((outH - dh) / 2);
    } else if(fit === "cover"){
      const ratio = Math.max(outW / iw, outH / ih);
      dw = Math.max(1, Math.round(iw * ratio));
      dh = Math.max(1, Math.round(ih * ratio));
      dx = Math.round((outW - dw) / 2);
      dy = Math.round((outH - dh) / 2);
    } else if(fit === "real"){
      dw = iw;
      dh = ih;
      dx = Math.round((outW - dw) / 2);
      dy = Math.round((outH - dh) / 2);
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, outW, outH);
    ctx.clip();
    ctx.drawImage(bg, dx, dy, dw, dh);
    ctx.restore();
  }

  for(const layer of state.imageLayers){
    if(!layer.visible || !layer.src) continue;
    const layerEl = work.querySelector(`.layer[data-layer-id="${layer.id}"]`);
    if(!layerEl || layerEl.style.display === "none") continue;

    const img = new Image();
    img.src = layer.src;
    try {
      await img.decode();
    } catch {
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("이미지 디코딩 실패"));
      });
    }

    const lr = layerEl.getBoundingClientRect();
    const x = (lr.left - wr.left - frameLeft) * scale;
    const y = (lr.top - wr.top - frameTop) * scale;
    const w = lr.width * scale;
    const h = lr.height * scale;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, outW, outH);
    ctx.clip();
    ctx.globalAlpha = clamp(layer.opacity ?? 1, 0, 1);
    ctx.globalCompositeOperation = toCanvasBlendMode(layer.blendMode);
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }

  if(state.show.text){
    const text = state.textLine || "문구";
    const tr = $("txtLayer").getBoundingClientRect();
    const tLeft = tr.left - wr.left;
    const tTop = tr.top - wr.top;
    const tW = tr.width;
    const tH = tr.height;

    const cx = (tLeft - frameLeft + tW / 2) * scale;
    const cy = (tTop - frameTop + tH / 2) * scale;

    const fontPx = Math.max(10, Math.round(state.txt.size * scale));
    ctx.save();
    ctx.font = `800 ${fontPx}px "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    ctx.fillStyle = "#111";
    ctx.fillText(text, cx, cy);
    ctx.restore();
  }

  return canvas;
}

async function exportPreviewBlob(){
  const m = resolveExportMetrics(currentTemplate);
  const longEdge = Math.max(m.printW, m.printH);
  const previewScale = longEdge > PREVIEW_LONG_EDGE ? (PREVIEW_LONG_EDGE / longEdge) : 1;
  const c = await renderFrameToCanvas(
    Math.max(1, Math.round(m.printW * previewScale)),
    Math.max(1, Math.round(m.printH * previewScale))
  );
  const blob = await canvasToBlobAsync(c, "image/jpeg", 0.95);
  return { blob, filename: `${$("jobId").textContent}_PREVIEW.jpg` };
}

async function exportPreviewJpg(){
  const { blob, filename } = await exportPreviewBlob();
  downloadBlob(blob, filename);
}

async function exportPrintBlob(){
  const m = resolveExportMetrics(currentTemplate);
  const c = await renderFrameToCanvas(m.printW, m.printH);
  const blob = await canvasToBlobAsync(c, "image/png");
  return { blob, filename: `${$("jobId").textContent}_PRINT.png` };
}

async function exportPrintPng(){
  const { blob, filename } = await exportPrintBlob();
  downloadBlob(blob, filename);
}

$("downloadSpec").addEventListener("click", async () => {
  try {
    await exportSpec();
  } catch (err) {
    alert(`SPEC 내보내기 실패: ${err.message || err}`);
  }
});

$("downloadPreview").addEventListener("click", async () => {
  try {
    await exportPreviewJpg();
  } catch (err) {
    alert(`PREVIEW 내보내기 실패: ${err.message || err}`);
  }
});

$("downloadPrint").addEventListener("click", async () => {
  try {
    await exportPrintPng();
  } catch (err) {
    alert(`PRINT 내보내기 실패: ${err.message || err}`);
  }
});

$("export").addEventListener("click", async () => {
  const v = validateAll();
  if(v.errors.length){
    alert("필수 입력이 부족해 생산파일을 생성할 수 없습니다.\n\n" + v.errors.join("\n"));
    return;
  }
  if(v.warnings.length){
    const go = confirm("경고가 있습니다. 그래도 생산파일을 생성할까요?\n\n" + v.warnings.join("\n"));
    if(!go) return;
  }
  try {
    await exportSpec();
    await exportPreviewJpg();
    await exportPrintPng();
    alert("다운로드 완료: SPEC.json / PREVIEW.jpg / PRINT.png");
  } catch (err) {
    alert(`생산파일 생성 실패: ${err.message || err}`);
  }
});

function resizeRulers(){
  // Ruler feature removed.
}

const cursorV = $("cursorV");
const cursorH = $("cursorH");

function showGuides(x, y){
  if(!state.show.guides){ cursorV.style.display = "none"; cursorH.style.display = "none"; return; }
  cursorV.style.display = "block"; cursorH.style.display = "block";
  cursorV.style.left = x + "px"; cursorH.style.top = y + "px";
}

work.addEventListener("mousemove", (e) => {
  const wr = work.getBoundingClientRect();
  const x = e.clientX - wr.left;
  const y = e.clientY - wr.top;
  showGuides(x, y);
});

work.addEventListener("mouseleave", () => {
  cursorV.style.display = "none";
  cursorH.style.display = "none";
});

const tbox = $("tbox");
const tboxLabel = $("tboxLabel");

function updateTBox(){
  const el = getSelectedEl();
  if(!el || el.style.display === "none"){ tbox.style.display = "none"; return; }

  const wr = work.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  tbox.style.left = (r.left - wr.left) + "px";
  tbox.style.top = (r.top - wr.top) + "px";
  tbox.style.width = r.width + "px";
  tbox.style.height = r.height + "px";
  tbox.style.display = "block";
  tboxLabel.textContent = state.selected === "img"
    ? `IMG ${Math.round(state.img.w)}×${Math.round(state.img.h)}px`
    : `TEXT ${state.txt.size}px`;
}

let resizing = false;
let handle = null;
let start = null;

function getPointer(evt){
  return evt.touches && evt.touches[0] ? {x:evt.touches[0].clientX, y:evt.touches[0].clientY} : {x:evt.clientX, y:evt.clientY};
}

function startResize(evt){
  if(!state.selected) return;
  if(state.selected === "img"){
    const active = getActiveImageLayer();
    const activeEl = getActiveImageLayerEl();
    if(!active || !activeEl || activeEl.style.display === "none" || active.locked) return;
  }
  if(state.selected === "text" && $("txtLayer").style.display === "none") return;
  const h = evt.target.dataset.h;
  if(!h) return;

  resizing = true;
  handle = h;
  const p = getPointer(evt);

  if(state.selected === "img"){
    start = { x:p.x, y:p.y, imgX:state.img.x, imgY:state.img.y, w:state.img.w, h:state.img.h, aspect:(state.img.h / state.img.w) || state.img.aspect || 1 };
  } else {
    const r = $("txtLayer").getBoundingClientRect();
    start = { x:p.x, y:p.y, txtX:state.txt.x, txtY:state.txt.y, fontSize:state.txt.size, boxW:r.width, boxH:r.height };
  }

  evt.preventDefault();
  evt.stopPropagation();
}

function moveResize(evt){
  if(!resizing || !start) return;

  const p = getPointer(evt);
  const dx = p.x - start.x;
  const dy = p.y - start.y;
  const keepRatio = !evt.shiftKey;
  const fromCenter = evt.altKey === true;
  const sx = (handle.includes("e") ? 1 : handle.includes("w") ? -1 : 0);
  const sy = (handle.includes("s") ? 1 : handle.includes("n") ? -1 : 0);
  const ddx = dx * sx;
  const ddy = dy * sy;

  if(state.selected === "img"){
    let nw = start.w, nh = start.h;
    let ox = start.imgX, oy = start.imgY;

    if(handle === "e" || handle === "w"){
      nw = Math.max(20, start.w + ddx);
      nh = keepRatio ? Math.round(nw * start.aspect) : start.h;
    } else if(handle === "n" || handle === "s"){
      nh = Math.max(20, start.h + ddy);
      nw = keepRatio ? Math.round(nh / start.aspect) : start.w;
    } else {
      const dom = Math.abs(ddx) > Math.abs(ddy) ? ddx : ddy;
      nw = Math.max(20, start.w + dom);
      nh = keepRatio ? Math.round(nw * start.aspect) : Math.max(20, start.h + ddy);
      if(!keepRatio) nw = Math.max(20, start.w + ddx);
    }

    if(!fromCenter){
      const dw = nw - start.w;
      const dh = nh - start.h;
      ox = start.imgX + (handle.includes("w") ? -dw / 2 : handle.includes("e") ? dw / 2 : 0);
      oy = start.imgY + (handle.includes("n") ? -dh / 2 : handle.includes("s") ? dh / 2 : 0);
    }

    state.img.w = nw;
    state.img.h = nh;
    state.img.x = ox;
    state.img.y = oy;

    const z = Math.round((state.img.w / (state.img.baseW || state.img.w)) * 100);
    $("zoom").value = Math.max(30, Math.min(300, z));
    $("zoomVal").textContent = $("zoom").value;
    applyImgTransform();
  } else {
    const fontInput = $("fontSize");
    const minSize = Number(fontInput.min || 8);
    const maxSize = Number(fontInput.max || 200);

    let scale = 1;
    if(handle === "e" || handle === "w") scale = (start.boxW + ddx) / start.boxW;
    else if(handle === "n" || handle === "s") scale = (start.boxH + ddy) / start.boxH;
    else scale = (start.boxW + (Math.abs(ddx) > Math.abs(ddy) ? ddx : ddy)) / start.boxW;

    if(!isFinite(scale) || scale <= 0) scale = 0.2;
    const nextSize = Math.max(minSize, Math.min(maxSize, Math.round(start.fontSize * scale)));

    const actualScale = nextSize / start.fontSize;
    const dw = start.boxW * actualScale - start.boxW;
    const dh = start.boxH * actualScale - start.boxH;

    let ox = start.txtX, oy = start.txtY;
    if(!fromCenter){
      ox = start.txtX + (handle.includes("w") ? -dw / 2 : handle.includes("e") ? dw / 2 : 0);
      oy = start.txtY + (handle.includes("n") ? -dh / 2 : handle.includes("s") ? dh / 2 : 0);
    }

    state.txt.size = nextSize;
    state.txt.x = ox;
    state.txt.y = oy;
    fontInput.value = String(nextSize);
    $("fontVal").textContent = String(nextSize);
    applyTextTransform();
  }

  validateAll();
  evt.preventDefault();
}

function endResize(){
  if(!resizing) return;
  resizing = false;
  handle = null;
  start = null;
  updateTBox();
}

tbox.addEventListener("pointerdown", startResize);
window.addEventListener("pointermove", moveResize);
window.addEventListener("pointerup", endResize);

work.addEventListener("wheel", (e) => {
  if(!(e.ctrlKey || e.metaKey)) return;
  e.preventDefault();

  const factor = Math.sign(e.deltaY) > 0 ? 0.95 : 1.05;

  if(state.selected === "img"){
    const active = getActiveImageLayer();
    const activeEl = getActiveImageLayerEl();
    if(!active || !activeEl || activeEl.style.display === "none" || active.locked) return;
    state.img.w = Math.max(20, Math.round(state.img.w * factor));
    state.img.h = Math.max(20, Math.round(state.img.h * factor));

    const z = Math.round((state.img.w / (state.img.baseW || state.img.w)) * 100);
    $("zoom").value = Math.max(30, Math.min(300, z));
    $("zoomVal").textContent = $("zoom").value;
    applyImgTransform();
  } else if(state.selected === "text"){
    if($("txtLayer").style.display === "none") return;
    const fontInput = $("fontSize");
    const nextSize = Math.max(Number(fontInput.min || 8), Math.min(Number(fontInput.max || 200), Math.round(state.txt.size * factor)));
    state.txt.size = nextSize;
    fontInput.value = String(nextSize);
    $("fontVal").textContent = String(nextSize);
    applyTextTransform();
  }

  validateAll();
}, {passive:false});

$("sbUrl").value = sbConfig.url || "";
$("sbAnonKey").value = sbConfig.anonKey || "";
$("sbBucket").value = sbConfig.bucket || "editor-assets";

$("sbConnectBtn").addEventListener("click", async () => {
  const btn = $("sbConnectBtn");
  btn.disabled = true;
  const prevText = btn.textContent;
  btn.textContent = "연결 중...";

  sbConfig = {
    url: ($("sbUrl").value || "").trim(),
    anonKey: ($("sbAnonKey").value || "").trim(),
    bucket: ($("sbBucket").value || "editor-assets").trim() || "editor-assets"
  };
  saveSbConfig(sbConfig);

  let ok = false;
  let attempt = 0;
  const maxAttempts = 2;
  while(attempt < maxAttempts && !ok){
    attempt += 1;
    ok = await connectSupabase();
    if(!ok && attempt < maxAttempts) await sleep(350);
  }

  if(!ok){
    const reason = sbLastError || "연결 테스트 실패";
    alert(
      "Supabase 연결 실패. LOCAL 모드로 전환했습니다.\n\n" +
      `시도 횟수: ${attempt}/${maxAttempts}\n` +
      `원인: ${reason}\n\n` +
      "확인 항목:\n- Project URL / Anon Key\n- Bucket 이름\n- templates/assets 테이블 및 RLS 정책"
    );
    try {
      await refreshProductData();
      await refreshTemplateData();
      await refreshAssetData();
    } finally {
      btn.disabled = false;
      btn.textContent = prevText;
    }
    return;
  }

  try {
    await refreshProductData();
    await refreshTemplateData();
    await refreshAssetData();
    alert(`Supabase 연동 완료: 템플릿/이미지 데이터를 원격에서 불러왔습니다. (시도 ${attempt}/${maxAttempts})`);
  } catch (err) {
    alert(`Supabase 데이터 로드 실패: ${err.message || err}`);
  } finally {
    btn.disabled = false;
    btn.textContent = prevText;
  }
});

function loadDraftSnapshot(){
  const raw = safeJsonParse(localStorage.getItem(STORE_KEYS.editorDraft), null);
  if(!raw || !raw.snapshot || typeof raw.snapshot !== "object") return null;
  return raw.snapshot;
}

function restoreDraftIfExists(){
  const snapshot = loadDraftSnapshot();
  if(!snapshot){
    setDraftState("없음");
    return false;
  }
  applyEditorSnapshot(snapshot);
  setDraftState("복원됨");
  return true;
}

window.addEventListener("beforeunload", () => {
  clearTimeout(autosaveDebounceTimer);
  saveDraftNow();
});

window.EditorBridge = {
  validate() {
    return validateAll();
  },
  getCurrentContext() {
    const product = getCurrentProduct();
    const spec = buildSpecObject();
    return {
      jobId: spec.jobId,
      productId: product.id,
      productName: product.name,
      templateId: currentTemplate?.id || "",
      templateName: currentTemplate?.name || "",
      order: { orderType: state.orderType, makeType: state.makeType, qty: state.qty },
      note: state.note,
      imageLayerCount: state.imageLayers.length
    };
  },
  async exportBundle() {
    const spec = await exportSpecBlob();
    const preview = await exportPreviewBlob();
    const print = await exportPrintBlob();
    return {
      spec,
      preview,
      print
    };
  }
};

async function init(){
  applyTextTransform();
  renderMode();
  setDraftState("준비");

  const connected = await connectSupabase();
  if(!connected) setSbStatus("LOCAL", false);

  try {
    await refreshProductData();
  } catch (err) {
    console.error("refreshProductData failed", err);
    products = loadProductsLocal();
    if(!products.length) products = [DEFAULT_PRODUCT];
    renderProductControls();
    renderAdminProductList();
  }

  try {
    await refreshTemplateData();
  } catch (err) {
    console.error("refreshTemplateData failed", err);
    templates = loadTemplatesLocal();
    if(!templates.length) templates = [DEFAULT_TEMPLATE];
    renderTemplateSelect();
    renderAdminTemplateList();
  }

  try {
    await refreshAssetData();
  } catch (err) {
    console.error("refreshAssetData failed", err);
    assets = loadAssetsLocal();
    renderAssetList();
    renderAdminAssetList();
  }
  renderImageLayers();
  renderLayerList();
  applyDefaultAssetForProduct(state.productId, true);
  restoreDraftIfExists();

  validateAll();
  historyPast.length = 0;
  historyFuture.length = 0;
  pushHistoryCheckpoint();
  updateHistoryButtons();
  resizeRulers();
  window.addEventListener("resize", () => {
    applyTemplateGeometry(currentTemplate);
    resizeRulers();
  });
  window.addEventListener("lf:catalog-updated", async (evt) => {
    try {
      await refreshProductData();
      await refreshTemplateData();
      await refreshAssetData();
      renderAssetList();
      validateAll();
    } catch (err) {
      console.error("catalog sync refresh failed", err);
      // Keep UI functional even when remote refresh fails.
      products = loadProductsLocal();
      if(!products.length) products = [DEFAULT_PRODUCT];
      renderProductControls();
      renderAdminProductList();
      templates = loadTemplatesLocal();
      if(!templates.length) templates = [DEFAULT_TEMPLATE];
      renderTemplateSelect();
      renderAdminTemplateList();
      assets = loadAssetsLocal();
      renderAssetList();
      renderAdminAssetList();
      validateAll();
    }
  });
}

init();
