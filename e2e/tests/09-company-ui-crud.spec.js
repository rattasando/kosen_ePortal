/**
 * 09-company-ui-crud.spec.js — ทดสอบ UI CRUD ของ Company
 * ─────────────────────────────────────────────────────────────
 * Create: ปุ่ม "+ เพิ่มบริษัท" ใน list → AddModal (.fixed.inset-0.z-50)
 *         required: ชื่อบริษัท (placeholder="บริษัท ...")
 *         addCompany() ใน context async แต่ไม่ await ใน handleSubmit → ใช้ waitForResponse
 * Edit:   list → click row → detail → "แก้ไข" → "บันทึก"
 * Delete: list → title="ลบ" → DeleteModal "ยืนยันการลบข้อมูล" → "ลบข้อมูล"
 *
 * หมายเหตุ: ใช้ ASCII สำหรับชื่อบริษัทที่สร้างใหม่ เพื่อ search ใน list ได้
 */

import { test, expect } from "../fixtures/base.fixture.js";

const LIST_URL   = "/admin/companies/list";
const DETAIL_URL = (id) => `/admin/companies/${id}`;

// ── Helpers ───────────────────────────────────────────────────

function makeCompanyData() {
  const ts = Date.now().toString().slice(-8);
  return { name: `CO-TEST-${ts}`, ts };
}

/**
 * สร้างบริษัทผ่าน AddModal แล้วรอ POST /api/companies
 * คืน created company object (มี id)
 */
async function createCompanyViaUI(page, { name }) {
  await page.goto(LIST_URL);
  await page.waitForLoadState("networkidle");

  // ปุ่ม "เพิ่มบริษัท" ใน toolbar (icon SVG + text — ไม่มี + prefix ใน text)
  await page.getByRole("button", { name: /เพิ่มบริษัท/ }).click();

  const modal = page.locator(".fixed.inset-0.z-50").last();
  await expect(modal.getByText("เพิ่มบริษัทใหม่")).toBeVisible({ timeout: 5_000 });

  // กรอกชื่อบริษัท (required)
  await modal.getByPlaceholder("บริษัท ...").fill(name);

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/companies") && r.request().method() === "POST",
      { timeout: 15_000 },
    ),
    // submit button: "💾 บันทึกบริษัท"
    modal.getByRole("button", { name: /บันทึกบริษัท/ }).click(),
  ]);
  expect(response.status()).toBe(201);

  // modal ปิดหลัง submit
  await expect(modal.getByText("เพิ่มบริษัทใหม่")).not.toBeVisible({ timeout: 5_000 });
  return response.json();
}

/**
 * ค้นหาบริษัทใน list ด้วยชื่อ (ASCII live filter)
 */
async function searchAndGetCompanyRow(page, name) {
  const searchInput = page.getByPlaceholder(
    "ชื่อบริษัท อุตสาหกรรม จังหวัด (Enter เพื่อค้นหา)"
  );
  await searchInput.fill(name);
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row.first()).toBeVisible({ timeout: 10_000 });
  return row.first();
}

// ── Tests: Create ─────────────────────────────────────────────

test("สร้างบริษัทใหม่ผ่าน AddModal → POST สำเร็จ", async ({ page }) => {
  const d = makeCompanyData();
  await createCompanyViaUI(page, d);
});

test("บริษัทที่สร้างใหม่ค้นหาเจอในรายการ", async ({ page }) => {
  const d = makeCompanyData();
  await createCompanyViaUI(page, d);
  await page.goto(LIST_URL);
  await page.waitForLoadState("networkidle");
  await searchAndGetCompanyRow(page, d.name);
});

// ── Tests: Delete ──────────────────────────────────────────────

test("ลบบริษัทที่สร้างใหม่ → หายจากรายการ", async ({ page }) => {
  const d = makeCompanyData();
  await createCompanyViaUI(page, d);

  await page.goto(LIST_URL);
  await page.waitForLoadState("networkidle");
  const row = await searchAndGetCompanyRow(page, d.name);
  await row.getByTitle("ลบ").click();

  // DeleteModal
  await expect(page.getByText("ยืนยันการลบข้อมูล")).toBeVisible({ timeout: 5_000 });

  const [delResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/companies/") && r.request().method() === "DELETE",
      { timeout: 10_000 },
    ),
    page.getByRole("button", { name: "ลบข้อมูล" }).click(),
  ]);
  expect(delResp.ok()).toBeTruthy();

  await expect(page.getByText("ยืนยันการลบข้อมูล")).not.toBeVisible({ timeout: 5_000 });
  await expect(
    page.getByRole("row").filter({ hasText: d.name })
  ).not.toBeVisible({ timeout: 5_000 });
});

// ── Tests: Read / Edit ─────────────────────────────────────────

test("รายชื่อบริษัทโหลดได้ และมีอย่างน้อย 1 row", async ({ page }) => {
  await page.goto(LIST_URL);
  // รอ table row ปรากฏ (นอกเหนือจาก header)
  await expect(page.getByRole("row").nth(1)).toBeVisible({ timeout: 8_000 });
});

test("กดที่ row → navigate ไปหน้า detail", async ({ page }) => {
  await page.goto(LIST_URL);
  // กด row แรก (index 1 = first data row)
  await page.getByRole("row").nth(1).click();
  await expect(page).toHaveURL(/\/admin\/companies\//, { timeout: 8_000 });
});

test("หน้า detail บริษัท — กด 'แก้ไข' → field เปิดแก้ไขได้", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("row").nth(1).click();
  await page.waitForURL(/\/admin\/companies\//, { timeout: 8_000 });

  await page.getByRole("button", { name: "แก้ไข" }).click();

  // ปุ่ม "บันทึก" ควรปรากฏ
  await expect(page.getByRole("button", { name: "บันทึก" })).toBeVisible();
});

test("แก้ไขชื่อบริษัทและ save → success (ปุ่ม 'บันทึก' กลับเป็น 'แก้ไข')", async ({ page }) => {
  // navigate ไป detail โดยตรงผ่าน list
  await page.goto(LIST_URL);
  await page.getByRole("row").nth(1).click();
  await page.waitForURL(/\/admin\/companies\/COM-/, { timeout: 8_000 });

  await page.getByRole("button", { name: "แก้ไข" }).click();
  await expect(page.getByRole("button", { name: "บันทึก" })).toBeVisible();

  // แก้ไข field ชื่อบริษัท (ภาษาอังกฤษ ใช้ input placeholder-free แต่ value ชัดเจน)
  // ใช้ locator บน input ที่ editing=true ถัดจาก label ที่ระบุ
  // input ชื่อภาษาไทย — ไม่มี placeholder; อ้างถึงด้วย label element ด้านบน
  // ใช้ page.getByLabel() ซึ่ง aria-label ไม่มี → ใช้ label text ผ่าน htmlFor pattern ไม่ได้
  // ใช้ locator ตาม position: label ก่อน input ใน section ชื่อบริษัท
  const nameSection = page.getByText("ชื่อบริษัท (ภาษาไทย)", { exact: false }).first();
  const nameInput   = nameSection.locator("..").locator("input").first();

  const currentName = await nameInput.inputValue();
  const newName = `${currentName.slice(0, 50)} (E2E)`;

  await nameInput.fill(newName);
  await page.getByRole("button", { name: "บันทึก" }).click();

  // หลัง save — ปุ่มกลับมาเป็น "แก้ไข"
  await expect(page.getByRole("button", { name: "แก้ไข" })).toBeVisible({ timeout: 8_000 });
});

test("กด 'ยกเลิก' ขณะแก้ไข → กลับ read-only โดยไม่บันทึก", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("row").nth(1).click();
  await page.waitForURL(/\/admin\/companies\//, { timeout: 8_000 });

  await page.getByRole("button", { name: "แก้ไข" }).click();
  await expect(page.getByRole("button", { name: "บันทึก" })).toBeVisible();

  // กด ยกเลิก
  await page.getByRole("button", { name: "ยกเลิก" }).click();

  // กลับมาเป็น read-only — ปุ่ม "บันทึก" หาย ปุ่ม "แก้ไข" กลับมา
  await expect(page.getByRole("button", { name: "แก้ไข" })).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole("button", { name: "บันทึก" })).not.toBeVisible();
});
