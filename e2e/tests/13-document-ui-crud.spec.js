/**
 * 13-document-ui-crud.spec.js — ทดสอบ UI CRUD ของ Documents
 * ─────────────────────────────────────────────────────────────
 * Documents ทำงานผ่าน modal ล้วน (ไม่มี detail page แยก):
 *
 * Create:
 *   ปุ่ม "+ เพิ่มเอกสาร" → DocumentModal "เพิ่มเอกสารใหม่"
 *   required: title (placeholder="ชื่อเอกสาร") + rawDate (input[type="date"])
 *   submit: "เพิ่มเอกสาร" → POST /api/documents
 *
 * Search:
 *   searchInput placeholder="ชื่อเอกสาร คำอธิบาย (Enter เพื่อค้นหา)"
 *   live filter บน searchInput.trim() — ไม่ต้อง Enter ก็กรอง
 *
 * Edit:
 *   row → title="แก้ไข" → DocumentModal "แก้ไขเอกสาร"
 *   แก้ title → "บันทึกการแก้ไข" → PUT /api/documents/[id]
 *
 * Delete:
 *   row → title="ลบ" → ConfirmDeleteModal heading="ยืนยันการลบเอกสาร"
 *   → ปุ่ม "ลบข้อมูล" → DELETE /api/documents/[id]
 *
 * หมายเหตุ:
 * - addDocument / updateDocument / deleteDocument ไม่ await ใน handleSave → ใช้ waitForResponse
 * - matchDoc ค้นหาจาก d.title และ d.description → ใช้ ASCII title เป็น unique key
 * - date input: page.fill('input[type="date"]', 'YYYY-MM-DD') หรือกด "ปัจจุบัน"
 */

import { test, expect } from "../fixtures/base.fixture.js";

const LIST_URL = "/admin/information/documents";

// ── Helpers ───────────────────────────────────────────────────

function makeDocData() {
  const ts = Date.now().toString().slice(-8);
  return {
    title: `DOC-TEST-${ts}`,   // ASCII unique — ใช้ค้นหาใน list
    ts,
  };
}

/**
 * เปิด DocumentModal (Add mode) แล้วกรอก title + date
 * คืน modal locator (ยังไม่ submit)
 */
async function openAddModal(page, title) {
  await page.goto(LIST_URL);
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "+ เพิ่มเอกสาร" }).click();
  const modal = page.locator(".fixed.inset-0.z-50").last();
  await expect(modal.getByText("เพิ่มเอกสารใหม่")).toBeVisible({ timeout: 5_000 });

  // กรอก title (required)
  await modal.getByPlaceholder("ชื่อเอกสาร").fill(title);

  // กด "ปัจจุบัน" เพื่อ set rawDate (required) — ง่ายกว่าหา input[type=date]
  await modal.getByRole("button", { name: "ปัจจุบัน" }).click();

  return modal;
}

/**
 * สร้าง document ผ่าน UI แล้วรอ POST /api/documents
 * คืน created doc object (มี id)
 */
async function createDocViaUI(page, { title }) {
  const modal = await openAddModal(page, title);

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/documents") && r.request().method() === "POST",
      { timeout: 15_000 },
    ),
    modal.getByRole("button", { name: "เพิ่มเอกสาร" }).click(),
  ]);
  expect(response.status()).toBe(201);

  // modal ปิดหลัง submit
  await expect(modal.getByText("เพิ่มเอกสารใหม่")).not.toBeVisible({ timeout: 5_000 });
  return response.json();
}

/**
 * ค้นหา document ใน list ด้วย title (ASCII live filter)
 * คืน row แรก
 */
async function searchAndGetDocRow(page, title) {
  const searchInput = page.getByPlaceholder(
    "ชื่อเอกสาร คำอธิบาย (Enter เพื่อค้นหา)"
  );
  await searchInput.fill(title);
  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row.first()).toBeVisible({ timeout: 10_000 });
  return row.first();
}

// ── Tests: List ────────────────────────────────────────────────

test("หน้า Documents โหลดและแสดงปุ่ม '+ เพิ่มเอกสาร'", async ({ page }) => {
  await page.goto(LIST_URL);
  await expect(
    page.getByRole("button", { name: "+ เพิ่มเอกสาร" })
  ).toBeVisible({ timeout: 8_000 });
});

test("กด '+ เพิ่มเอกสาร' → modal 'เพิ่มเอกสารใหม่' ขึ้น", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "+ เพิ่มเอกสาร" }).click();
  await expect(page.getByText("เพิ่มเอกสารใหม่")).toBeVisible({ timeout: 5_000 });
});

test("modal เพิ่มเอกสาร — ปุ่ม disabled เมื่อยังไม่กรอก title", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "+ เพิ่มเอกสาร" }).click();
  const modal = page.locator(".fixed.inset-0.z-50").last();
  await expect(modal.getByText("เพิ่มเอกสารใหม่")).toBeVisible({ timeout: 5_000 });

  // ยังไม่กรอก title + rawDate → ปุ่มยืนยัน disabled
  const submitBtn = modal.getByRole("button", { name: "เพิ่มเอกสาร" });
  await expect(submitBtn).toBeDisabled();
});

test("ปิด modal ด้วย ESC", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "+ เพิ่มเอกสาร" }).click();
  await expect(page.getByText("เพิ่มเอกสารใหม่")).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press("Escape");
  await expect(page.getByText("เพิ่มเอกสารใหม่")).not.toBeVisible({ timeout: 3_000 });
});

// ── Tests: Create ─────────────────────────────────────────────

test("สร้างเอกสารใหม่สำเร็จ → POST 201", async ({ page }) => {
  const d = makeDocData();
  await createDocViaUI(page, d);
});

test("เอกสารที่สร้างใหม่ค้นหาเจอในรายการ", async ({ page }) => {
  const d = makeDocData();
  await createDocViaUI(page, d);

  // navigate ใหม่แล้วค้นหา (clear sessionStorage filter ไม่จำเป็น — searchInput ยังว่าง)
  await page.goto(LIST_URL);
  await page.waitForLoadState("networkidle");
  await searchAndGetDocRow(page, d.title);
});

// ── Tests: Edit ────────────────────────────────────────────────

test("แก้ไขเอกสาร — เปลี่ยน title → API ยืนยัน", async ({ page }) => {
  const d = makeDocData();
  await createDocViaUI(page, d);

  // ค้นหา row แล้วกด "แก้ไข"
  await page.goto(LIST_URL);
  await page.waitForLoadState("networkidle");
  const row = await searchAndGetDocRow(page, d.title);
  await row.getByTitle("แก้ไข").click();

  // DocumentModal — edit mode
  const editModal = page.locator(".fixed.inset-0.z-50").last();
  await expect(editModal.getByText("แก้ไขเอกสาร")).toBeVisible({ timeout: 5_000 });

  // เปลี่ยน title
  const updatedTitle = `${d.title}-EDIT`;
  const titleInput = editModal.getByPlaceholder("ชื่อเอกสาร");
  await titleInput.fill(updatedTitle);

  // updateDocument() ไม่ await ใน handleSave → ใช้ waitForResponse
  const [putResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/documents/") && r.request().method() === "PUT",
      { timeout: 15_000 },
    ),
    editModal.getByRole("button", { name: "บันทึกการแก้ไข" }).click(),
  ]);
  expect(putResp.ok()).toBeTruthy();

  const body = await putResp.json();
  expect(body.title).toBe(updatedTitle);
});

// ── Tests: Delete ──────────────────────────────────────────────

test("ลบเอกสาร → หายจากรายการ", async ({ page }) => {
  const d = makeDocData();
  await createDocViaUI(page, d);

  // ค้นหา row แล้วกด "ลบ"
  await page.goto(LIST_URL);
  await page.waitForLoadState("networkidle");
  const row = await searchAndGetDocRow(page, d.title);
  await row.getByTitle("ลบ").click();

  // ConfirmDeleteModal
  await expect(page.getByText("ยืนยันการลบเอกสาร")).toBeVisible({ timeout: 5_000 });

  // deleteDocument() ไม่ await ใน onConfirm → ใช้ waitForResponse
  const [delResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/documents/") && r.request().method() === "DELETE",
      { timeout: 10_000 },
    ),
    page.getByRole("button", { name: "ลบเอกสาร" }).click(),
  ]);
  expect(delResp.ok()).toBeTruthy();

  // modal ปิด + row หาย
  await expect(page.getByText("ยืนยันการลบเอกสาร")).not.toBeVisible({ timeout: 5_000 });
  await expect(
    page.getByRole("row").filter({ hasText: d.title })
  ).not.toBeVisible({ timeout: 8_000 });
});
