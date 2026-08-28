/**
 * 11-mapping-ui-crud.spec.js — ทดสอบ UI ของ Applications/Mapping
 * ─────────────────────────────────────────────────────────────
 * Mapping (ApplicationRecord) ต้องการ Student + Job ที่มีอยู่จริงในระบบ
 * → ใช้ test.beforeAll สร้าง student + job ผ่าน API แล้วลบใน afterAll
 *
 * Create flow:
 *   "+ เพิ่มรายการ" → AddMappingModal
 *   → SearchPicker นักเรียน: พิมพ์ university ที่ unique → click dropdown item
 *   → SearchPicker งาน: พิมพ์ job title ที่ unique → click dropdown item
 *   → click "เพิ่มรายการ" → POST /api/mappings
 *
 * Edit flow:
 *   list row → title="แก้ไขสถานะ" → EditMappingModal
 *   → click status button "ไม่ผ่านการคัดเลือก" → "บันทึกการเปลี่ยนแปลง"
 *   → PUT /api/mappings/[id]
 *
 * Delete flow:
 *   list row → title="ลบ" → ConfirmDeleteModal "ยืนยันการลบการสมัคร" → "ลบข้อมูล"
 *   → DELETE /api/mappings/[id]
 *
 * หมายเหตุ:
 * - addMapping() ใน MappingListClient ไม่ await → ใช้ waitForResponse(POST)
 * - SearchPicker item ใช้ onMouseDown → Playwright .click() trigger ได้ปกติ
 * - ค้นหาใน list ผ่าน searchInput live filter (ไม่ต้อง Enter)
 * - ASCII title/university เพื่อ fill() ทำงานได้
 */

import { test, expect } from "../fixtures/base.fixture.js";

const LIST_URL = "/admin/marketplace/applications";

// ── Shared test data (populated in beforeAll) ─────────────────
let testStudentId   = "";
let testJobId       = "";
let testStudentName = "";  // unique ASCII name for student SearchPicker search
let testJobTitle    = "";  // unique ASCII job title for job SearchPicker + list search

// ── Setup / Teardown ──────────────────────────────────────────

test.beforeAll(async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  testStudentName = `MAPSTU${ts}`;         // unique ASCII — searchable via s.name
  testJobTitle    = `MAPJOB-${ts}`;
  testJobId       = `JMAP${ts.slice(-6)}`; // ≤ 20 chars (VarChar 20)

  // สร้าง student (id auto-gen) ใช้ ASCII name เพราะ filterFn ค้นหา s.name
  // (Student model ไม่มี top-level university field — university อยู่ใน StudentEnrollment)
  const stuRes = await apiRequest.post("/api/students", {
    data: {
      name:     testStudentName,
      lastname: "MAPTest",
      status:   "กำลังศึกษา",
    },
  });
  expect(stuRes.status()).toBe(201);
  const stu = await stuRes.json();
  testStudentId = stu.id;

  // สร้าง job (id ต้องระบุ)
  const jobRes = await apiRequest.post("/api/jobs", {
    data: {
      id:          testJobId,
      title:       testJobTitle,
      companyName: `MAPCO-${ts}`,
      type:        "ฝึกงาน",
      field:       "วิศวกรรมคอมพิวเตอร์",
      status:      "เปิดรับสมัคร",
    },
  });
  expect(jobRes.status()).toBe(201);
});

test.afterAll(async ({ apiRequest }) => {
  // ลบ student + job ที่สร้างสำหรับ test (ลบ mapping ก่อนถ้ายังมี)
  if (testStudentId) {
    await apiRequest.delete(`/api/students/${testStudentId}`).catch(() => {});
  }
  if (testJobId) {
    await apiRequest.delete(`/api/jobs/${testJobId}`).catch(() => {});
  }
});

// ── Helpers ───────────────────────────────────────────────────

/**
 * เปิด AddMappingModal แล้วเลือก student + job ผ่าน SearchPicker
 * คืน modal locator (ยังไม่ confirm)
 */
async function openAddModalAndSelect(page) {
  await page.goto(LIST_URL);
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "เพิ่มรายการ" }).click();
  const modal = page.locator(".fixed.inset-0.z-50").last();
  await expect(modal.getByText("เพิ่มรายการสมัครงาน")).toBeVisible({ timeout: 5_000 });

  // ── Student picker ──────────────────────────────────────────
  // พิมพ์ name ที่ unique (ASCII) → filterFn ค้นหา s.name → dropdown แสดง → click
  const stuInput = modal.getByPlaceholder("พิมพ์ชื่อ, รหัส, หรือมหาวิทยาลัย...");
  await stuInput.fill(testStudentName);
  // รอ dropdown item ปรากฏ (ชื่อ student ที่สร้าง)
  const stuDropdown = modal.locator(".absolute.z-20").first();
  await expect(stuDropdown.getByRole("button").first()).toBeVisible({ timeout: 8_000 });
  await stuDropdown.getByRole("button").first().click();

  // ── Job picker ──────────────────────────────────────────────
  const jobInput = modal.getByPlaceholder("พิมพ์ชื่อตำแหน่ง, บริษัท, หรือสาขา...");
  await jobInput.fill(testJobTitle);
  const jobDropdown = modal.locator(".absolute.z-20").first();
  await expect(jobDropdown.getByRole("button").first()).toBeVisible({ timeout: 8_000 });
  await jobDropdown.getByRole("button").first().click();

  return modal;
}

/**
 * ค้นหา mapping ใน list ด้วย job title (ASCII live filter)
 * คืน row แรก
 */
async function searchAndGetMappingRow(page, title) {
  const searchInput = page.getByPlaceholder(
    "ชื่อนักเรียน ตำแหน่งงาน บริษัท (Enter เพื่อค้นหา)"
  );
  await searchInput.fill(title);
  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row.first()).toBeVisible({ timeout: 10_000 });
  return row.first();
}

// ── Smoke Tests (เดิม) ────────────────────────────────────────

test("หน้า Applications โหลดได้", async ({ page }) => {
  await page.goto(LIST_URL);
  await expect(page.getByRole("main")).toBeVisible();
});

test("ปุ่ม 'เพิ่มรายการ' ปรากฏ", async ({ page }) => {
  await page.goto(LIST_URL);
  await expect(
    page.getByRole("button", { name: "เพิ่มรายการ" })
  ).toBeVisible({ timeout: 8_000 });
});

test("กด 'เพิ่มรายการ' → AddMappingModal ขึ้น", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "เพิ่มรายการ" }).click();
  await expect(page.getByText("เพิ่มรายการสมัครงาน")).toBeVisible({ timeout: 5_000 });
});

test("modal มี section นักเรียน และ ตำแหน่งงาน", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "เพิ่มรายการ" }).click();
  await expect(page.getByText("เพิ่มรายการสมัครงาน")).toBeVisible({ timeout: 5_000 });
  await expect(
    page.getByPlaceholder("พิมพ์ชื่อ, รหัส, หรือมหาวิทยาลัย...").first()
  ).toBeVisible();
  await expect(
    page.getByPlaceholder("พิมพ์ชื่อตำแหน่ง, บริษัท, หรือสาขา...").first()
  ).toBeVisible();
});

test("ปิด AddMappingModal ด้วย ESC", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "เพิ่มรายการ" }).click();
  await expect(page.getByText("เพิ่มรายการสมัครงาน")).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press("Escape");
  await expect(page.getByText("เพิ่มรายการสมัครงาน")).not.toBeVisible({ timeout: 3_000 });
});

test("กด 'เพิ่มรายการ' โดยไม่เลือก → ปุ่มยืนยัน disabled", async ({ page }) => {
  await page.goto(LIST_URL);
  await page.getByRole("button", { name: "เพิ่มรายการ" }).click();
  await expect(page.getByText("เพิ่มรายการสมัครงาน")).toBeVisible({ timeout: 5_000 });
  const modal = page.locator(".fixed.inset-0.z-50").last();
  const confirmBtn = modal.getByRole("button", { name: "เพิ่มรายการ" });
  await expect(confirmBtn).toBeDisabled();
});

// ── CRUD Tests ────────────────────────────────────────────────

test("สร้าง Mapping ใหม่สำเร็จ → POST 201", async ({ page }) => {
  const modal = await openAddModalAndSelect(page);

  // addMapping() ไม่ await ใน list → ใช้ waitForResponse
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/mappings") && r.request().method() === "POST",
      { timeout: 15_000 },
    ),
    modal.getByRole("button", { name: "เพิ่มรายการ" }).click(),
  ]);
  expect(response.status()).toBe(201);

  // modal ปิด
  await expect(modal.getByText("เพิ่มรายการสมัครงาน")).not.toBeVisible({ timeout: 5_000 });
});

test("Mapping ที่สร้างใหม่ค้นหาเจอในรายการ", async ({ page }) => {
  // สร้าง mapping ใหม่ก่อน
  const modal = await openAddModalAndSelect(page);
  const [postResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/mappings") && r.request().method() === "POST",
      { timeout: 15_000 },
    ),
    modal.getByRole("button", { name: "เพิ่มรายการ" }).click(),
  ]);
  expect(postResp.status()).toBe(201);

  // ค้นหาด้วย job title (ASCII)
  await searchAndGetMappingRow(page, testJobTitle);
});

test("แก้ไข Mapping — เปลี่ยน status → API ยืนยัน", async ({ page }) => {
  // สร้าง mapping ใหม่ก่อน
  const modal = await openAddModalAndSelect(page);
  const [postResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/mappings") && r.request().method() === "POST",
      { timeout: 15_000 },
    ),
    modal.getByRole("button", { name: "เพิ่มรายการ" }).click(),
  ]);
  expect(postResp.status()).toBe(201);

  // ค้นหา row + กด "แก้ไขสถานะ"
  const row = await searchAndGetMappingRow(page, testJobTitle);
  await row.getByTitle("แก้ไขสถานะ").click();

  // EditMappingModal
  const editModal = page.locator(".fixed.inset-0.z-50").last();
  await expect(editModal).toBeVisible({ timeout: 5_000 });

  // เปลี่ยน status เป็น "ไม่ผ่านการคัดเลือก"
  await editModal.getByRole("button", { name: "ไม่ผ่านการคัดเลือก" }).click();

  // รอ PUT + บันทึก
  // updateMapping() ไม่ await ใน list → ใช้ waitForResponse
  const [putResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/mappings/") && r.request().method() === "PUT",
      { timeout: 15_000 },
    ),
    editModal.getByRole("button", { name: "บันทึกการเปลี่ยนแปลง" }).click(),
  ]);
  expect(putResp.ok()).toBeTruthy();

  const body = await putResp.json();
  expect(body.status).toBe("ไม่ผ่านการคัดเลือก");
});

test("ลบ Mapping → หายจากรายการ", async ({ page }) => {
  // สร้าง mapping ใหม่ก่อน
  const modal = await openAddModalAndSelect(page);
  const [postResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/mappings") && r.request().method() === "POST",
      { timeout: 15_000 },
    ),
    modal.getByRole("button", { name: "เพิ่มรายการ" }).click(),
  ]);
  expect(postResp.status()).toBe(201);

  // ค้นหา row + กด "ลบ"
  const row = await searchAndGetMappingRow(page, testJobTitle);
  await row.getByTitle("ลบ").click();

  // ConfirmDeleteModal
  await expect(page.getByText("ยืนยันการลบการสมัคร")).toBeVisible({ timeout: 5_000 });

  // รอ DELETE + confirm
  const [delResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/mappings/") && r.request().method() === "DELETE",
      { timeout: 10_000 },
    ),
    page.getByRole("button", { name: "ลบข้อมูล" }).click(),
  ]);
  expect(delResp.ok()).toBeTruthy();

  // modal ปิด + row หาย
  await expect(page.getByText("ยืนยันการลบการสมัคร")).not.toBeVisible({ timeout: 5_000 });
  await expect(
    page.getByRole("row").filter({ hasText: testJobTitle })
  ).not.toBeVisible({ timeout: 8_000 });
});
