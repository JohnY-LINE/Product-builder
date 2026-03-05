#!/usr/bin/env node
import process from "node:process";

const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:4173";
const appUrl = `${baseUrl}/index.html#/admin/products`;
const e2eRequired = process.env.E2E_REQUIRED === "1";

function log(step, message) {
  process.stdout.write(`[${step}] ${message}\n`);
}

function fail(message) {
  process.stderr.write(`[FAIL] ${message}\n`);
  process.exit(1);
}

function skip(message) {
  if (e2eRequired) {
    fail(`E2E_REQUIRED=1 모드에서 SKIP 불가: ${message}`);
  }
  process.stdout.write(`[SKIP] ${message}\n`);
  process.exit(0);
}

async function main() {
  let chromium;
  try {
    const mod = await import("playwright");
    chromium = mod.chromium;
  } catch {
    skip("`playwright` 패키지가 없어 E2E를 건너뜁니다.");
  }

  if (!chromium) fail("Playwright chromium launcher를 초기화하지 못했습니다.");

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    const message = String(err?.message || err || "");
    if (message.includes("error while loading shared libraries")) {
      skip("브라우저 런타임 라이브러리 부족(libglib 등)으로 E2E를 건너뜁니다.");
    }
    if (message.includes("Executable doesn't exist")) {
      skip("Playwright 브라우저 바이너리가 없어 E2E를 건너뜁니다.");
    }
    throw err;
  }
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    log("1/8", `Open admin page: ${appUrl}`);
    await page.goto(appUrl, { waitUntil: "domcontentloaded", timeout: 20000 });

    log("2/8", "Assert admin products page visible");
    await page.waitForSelector("#page-admin-products:not([hidden])", { timeout: 15000 });
    await page.waitForSelector("#adminDeleteSelectedProductsBtn", { timeout: 10000 });

    log("3/8", "Assert top category nav rendered");
    const navCount = await page.locator(".commerceNav [data-top-category]").count();
    if (navCount < 1) fail("Top category nav items not found.");

    log("4/8", "Move to product-new form");
    await page.goto(`${baseUrl}/index.html#/admin/products/new`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForSelector("#page-admin-product-form:not([hidden])", { timeout: 15000 });
    await page.waitForSelector("#adminFormProductId", { timeout: 10000 });
    await page.waitForSelector("#adminFormSaveBtn", { timeout: 10000 });

    log("5/8", "Move to templates page");
    await page.goto(`${baseUrl}/index.html#/admin/templates`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForSelector("#page-admin-templates:not([hidden])", { timeout: 15000 });
    await page.waitForSelector("#addTemplateBtn", { timeout: 10000 });
    await page.waitForSelector("#adminTplProduct", { timeout: 10000 });

    log("6/8", "Move to options page");
    await page.goto(`${baseUrl}/index.html#/admin/options`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForSelector("#page-admin-options:not([hidden])", { timeout: 15000 });
    await page.waitForSelector("#adminOptionProduct", { timeout: 10000 });

    log("7/8", "Move to inbox page");
    await page.goto(`${baseUrl}/index.html#/admin/inbox`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForSelector("#page-admin-inbox:not([hidden])", { timeout: 15000 });
    await page.waitForSelector("#adminInboxBody", { timeout: 10000 });

    log("8/8", "Return to products and verify workspace stats");
    await page.goto(`${baseUrl}/index.html#/admin/products`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForSelector("#adminProductsSummary", { timeout: 10000 });
    const summaryCards = await page.locator("#adminProductsSummary .adminSummaryCard").count();
    if (summaryCards < 1) fail("Admin summary cards not rendered.");

    process.stdout.write("Admin E2E smoke passed.\n");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  fail(err?.message || String(err));
});
