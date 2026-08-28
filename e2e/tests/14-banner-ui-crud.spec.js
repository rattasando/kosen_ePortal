/**
 * 14-banner-ui-crud.spec.js — ทดสอบ UI ของ Banner
 * ─────────────────────────────────────────────────────────────
 * Banner ไม่มีตาราง/หน้า detail — ทำงานผ่าน BannerCard grid + BannerModal
 *
 * Create:
 *   "+ เพิ่ม Banner" → BannerModal "เพิ่ม Banner ใหม่"
 *   required: headline (contenteditable, data-ph="หัวข้อหลัก…")
 *           + ctaLabel (contenteditable, data-ph="ข้อความปุ่ม…")
 *           + ctaHref (input[text], placeholder="/news/1 หรือ https://…")
 *   submit: "เพิ่ม Banner" → POST /api/banners
 *
 * Delete (inline ใน card — ไม่มี modal แยก):
 *   card action bar → ปุ่ม X (สุดท้ายใน action bar)
 *   → "ลบ Banner นี้?" → "ยืนยัน" → DELETE /api/banners/[id]
 *
 * Edit:
 *   card → "แก้ไข" → BannerModal "แก้ไข Banner" → "บันทึกการแก้ไข" → PUT
 *
 * Preview:
 *   toolbar → "พรีวิวทั้งหมด" → AllBannersPreviewModal → ESC ปิด
 *
 * หมายเหตุ:
 * - addBanner / updateBanner / deleteBanner ไม่ await ใน handleSave/onDelete → ใช้ waitForResponse
 * - EditableField ใช้ onInput → Playwright fill() บน contenteditable trigger React state ได้
 * - หา card ด้วย .filter({ hasText, has: button แก้ไข }).last() → ได้ card div (ไม่ใช่ ancestor)
 * - ASCII เท่านั้นสำหรับ headline ที่ใช้ค้นหา (fill() กับ Thai บน contenteditable อาจ hang)
 */

import { test, expect } from "../fixtures/base.fixture.js";

const LIST_URL = "/admin/information/banner";

// ── Helpers ───────────────────────────────────────────────────

function makeBannerData() {
  const ts = Date.now().toString().slice(-8);
  return {
    headline: `BANNER-TEST-${ts}`,   // ASCII unique — searchable via card text
    ctaLabel: `CTA-${ts}`,
    ctaHref:  `/test-${ts}`,
    ts,
  };
}

/**
 * เปิด BannerModal (Add mode) แล้วกรอก headline + ctaLabel + ctaHref
 * คืน modal locator (ยังไม่ submit)
 */
async function openAddModal(page, { headline, ctaLabel, ctaHref }) {
  await page.goto(LIST_URL);
  // รอปุ่มพร้อม (ไม่ใช้ networkidle — BannerContext ดึง news ทำให้ยังมี request ค้างอยู่)
  const addBtn = page.getByRole("button", { name: "+ เพิ่ม Banner" });
  await expect(addBtn).toBeVisible({ timeout: 10_000 });

  await addBtn.click();
  const modal = page.locator(".fixed.inset-0.z-50").last();
  await expect(modal.getByText("เพิ่ม Banner ใหม่")).toBeVisible({ timeout: 5_000 });

  // headline — contenteditable (data-ph="หัวข้อหลัก…")
  // Playwright fill() บน contenteditable fires onInput → React state update ✅
  const headlineEl = modal.locator('[data-ph*="หัวข้อหลัก"]');
  await headlineEl.click();
  await headlineEl.fill(headline);

  // ctaLabel — contenteditable (data-ph="ข้อความปุ่ม…")
  const ctaLabelEl = modal.locator('[data-ph*="ข้อความปุ่ม"]');
  await ctaLabelEl.click();
  await ctaLabelEl.fill(ctaLabel);

  // ctaHref — regular input
  await modal.getByPlaceholder("/news/1 หรือ https://…").fill(ctaHref);

  return modal;
}

/**
 * สร้าง Banner ผ่าน UI แล้วรอ POST /api/banners
 * คืน created banner object (มี id)
 */
async function createBannerViaUI(page, data) {
  const modal = await openAddModal(page, data);

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/banners") && r.request().method() === "POST",
      { timeout: 15_000 },
    ),
    modal.getByRole("button", { name: "เพิ่ม Banner" }).click(),
  ]);
  expect(response.status()).toBe(201);

  // modal ปิด
  await expect(modal.getByText("เพิ่ม Banner ใหม่")).not.toBeVisible({ timeout: 5_000 });
  return response.json();
}

/**
 * หา banner card ใน grid ที่มี headline text + 'แก้ไข' button
 * ใช้ .last() เพื่อได้ card div (ไม่ใช่ ancestor ที่ match ด้วย)
 */
function getBannerCard(page, headline) {
  return page.locator("div").filter({
    hasText: headline,
    has: page.getByRole("button", { name: "แก้ไข" }),
  }).last();
}

// ── Tests: Smoke ──────────────────────────────────────────────

test("หน้า Banner โหลดและแสดงปุ่ม '+ เพิ่ม Banner'", async ({ page }) => {
  await page.goto(LIST_URL);
  await expect(
    page.getByRole("button", { name: "+ เพิ่ม Banner" })
  ).toBeVisible({ timeout: 8_000 });
});

test("กด '+ เพิ่ม Banner' → modal 'เพิ่ม Banner ใหม่' ขึ้น", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "+ เพิ่ม Banner" }).click();
  await expect(page.getByText("เพิ่ม Banner ใหม่")).toBeVisible({ timeout: 5_000 });
});

test("ปิด modal ด้วย ESC", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "+ เพิ่ม Banner" }).click();
  await expect(page.getByText("เพิ่ม Banner ใหม่")).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press("Escape");
  await expect(page.getByText("เพิ่ม Banner ใหม่")).not.toBeVisible({ timeout: 3_000 });
});

test("ปิด modal ด้วยปุ่ม 'ยกเลิก'", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "+ เพิ่ม Banner" }).click();
  const modal = page.locator(".fixed.inset-0.z-50").last();
  await expect(modal.getByText("เพิ่ม Banner ใหม่")).toBeVisible({ timeout: 5_000 });
  await modal.getByRole("button", { name: "ยกเลิก" }).click();
  await expect(modal.getByText("เพิ่ม Banner ใหม่")).not.toBeVisible({ timeout: 3_000 });
});

test("ปุ่ม 'พรีวิวทั้งหมด' มองเห็นได้ (seed banners มีอยู่)", async ({ page }) => {
  await page.goto(LIST_URL);
  // ปุ่มนี้แสดงเมื่อมี active banners — seed data ควรมีอย่างน้อย 1 ตัว
  await expect(
    page.getByRole("button", { name: "พรีวิวทั้งหมด" })
  ).toBeVisible({ timeout: 8_000 });
});

test("กด 'พรีวิวทั้งหมด' → slider preview เปิด → ESC ปิด", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "พรีวิวทั้งหมด" }).click();
  // AllBannersPreviewModal แสดง "พรีวิว Banner ทั้งหมด"
  await expect(page.getByText("พรีวิว Banner ทั้งหมด")).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press("Escape");
  await expect(page.getByText("พรีวิว Banner ทั้งหมด")).not.toBeVisible({ timeout: 3_000 });
});

// ── Tests: Create ─────────────────────────────────────────────

test("สร้าง Banner ใหม่สำเร็จ → POST 201", async ({ page }) => {
  const d = makeBannerData();
  await createBannerViaUI(page, d);
});

test("Banner ที่สร้างใหม่ปรากฏใน grid", async ({ page }) => {
  const d = makeBannerData();
  await createBannerViaUI(page, d);

  // headline ควรปรากฏในหน้าเป็น text บน card
  await expect(page.getByText(d.headline).first()).toBeVisible({ timeout: 8_000 });
});

// ── Tests: Edit ────────────────────────────────────────────────

test("กด 'แก้ไข' บน card → BannerModal 'แก้ไข Banner' เปิด", async ({ page }) => {
  const d = makeBannerData();
  await createBannerViaUI(page, d);

  // หา card ที่สร้างใหม่
  const card = getBannerCard(page, d.headline);
  await expect(card).toBeVisible({ timeout: 8_000 });
  await card.getByRole("button", { name: "แก้ไข" }).click();

  // edit modal เปิด
  await expect(page.getByText("แก้ไข Banner")).toBeVisible({ timeout: 5_000 });
});

test("แก้ไข Banner — เปลี่ยน ctaHref → PUT สำเร็จ", async ({ page }) => {
  const d = makeBannerData();
  const created = await createBannerViaUI(page, d);

  const card = getBannerCard(page, d.headline);
  await card.getByRole("button", { name: "แก้ไข" }).click();

  const editModal = page.locator(".fixed.inset-0.z-50").last();
  await expect(editModal.getByText("แก้ไข Banner")).toBeVisible({ timeout: 5_000 });

  // เปลี่ยน ctaHref (regular input)
  const newHref = `/updated-${d.ts}`;
  await editModal.getByPlaceholder("/news/1 หรือ https://…").fill(newHref);

  // updateBanner() ไม่ await ใน handleSave → ใช้ waitForResponse
  const [putResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/banners/") && r.request().method() === "PUT",
      { timeout: 15_000 },
    ),
    editModal.getByRole("button", { name: "บันทึกการแก้ไข" }).click(),
  ]);
  expect(putResp.ok()).toBeTruthy();

  const body = await putResp.json();
  expect(body.ctaHref).toBe(newHref);
});

// ── Tests: Delete ──────────────────────────────────────────────

test("ลบ Banner — X → ยืนยัน → DELETE", async ({ page }) => {
  const d = makeBannerData();
  await createBannerViaUI(page, d);

  // หา card + คลิกปุ่ม X (ปุ่มสุดท้ายใน action bar)
  const card = getBannerCard(page, d.headline);
  await expect(card).toBeVisible({ timeout: 8_000 });

  // ปุ่ม X เป็นปุ่มสุดท้ายใน action bar (SVG icon ล้วน ไม่มี text)
  await card.locator("button").last().click();

  // inline confirm — "ลบ Banner นี้?"
  await expect(card.getByText("ลบ Banner นี้?")).toBeVisible({ timeout: 3_000 });

  // deleteBanner() ไม่ await ใน onDelete → ใช้ waitForResponse
  const [delResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/banners/") && r.request().method() === "DELETE",
      { timeout: 10_000 },
    ),
    card.getByRole("button", { name: "ยืนยัน" }).click(),
  ]);
  expect(delResp.ok()).toBeTruthy();

  // headline หายจากหน้า
  await expect(page.getByText(d.headline)).not.toBeVisible({ timeout: 8_000 });
});
