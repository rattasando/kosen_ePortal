/**
 * 10-job-ui-crud.spec.js — ทดสอบ UI CRUD ของ Job Positions
 * ─────────────────────────────────────────────────────────────
 * Job Positions มีหน้า create (/admin/marketplace/job-positions/new)
 * และ detail page (/admin/marketplace/job-positions/[id])
 *
 * create:
 *   - Link "เพิ่มตำแหน่งงาน" (ไม่มี +) → /new
 *   - title: placeholder="วิศวกรซอฟต์แวร์ฝึกงาน"
 *   - submit: type=submit "บันทึกข้อมูล"
 *   - success: URL ยังอยู่ที่ /new แต่ content เปลี่ยนเป็น "เพิ่มตำแหน่งงานสำเร็จ!"
 *
 * delete:
 *   - ปุ่ม title="ลบ" ใน list row → ConfirmDeleteModal heading "ยืนยันการลบตำแหน่งงาน" → "ลบข้อมูล"
 *
 * edit:
 *   - navigate ไป detail/?edit=1 → เปลี่ยน title → "บันทึก"
 *   - updateJob() ใน context ไม่ await ใน handleSave → ใช้ waitForResponse(PUT)
 *
 * หมายเหตุ: ใช้ ASCII สำหรับ title เพื่อหลีกเลี่ยงปัญหา fill() กับ Thai text
 *   Draft jobs เรียงได้ปกติ แต่ใช้ search เพื่อหาใน list ให้ confirm ว่าปรากฏ
 */

import { test, expect } from "../fixtures/base.fixture.js";

const LIST_URL = "/admin/marketplace/job-positions";
const NEW_URL  = "/admin/marketplace/job-positions/new";

// ── helpers ───────────────────────────────────────────────────

function makeJobData() {
  const ts = Date.now().toString().slice(-8);
  return {
    title:       `JOB-UI-TEST-${ts}`,        // ASCII เท่านั้น
    companyName: `COMPANY-TEST-${ts}`,        // ASCII เท่านั้น
    field:       "วิศวกรรมคอมพิวเตอร์",       // ค่าแรกใน JOB_FIELDS — ใช้ selectOption()
    ts,
  };
}

/** กรอก form ขั้นต่ำที่จำเป็นสำหรับ isValid */
async function fillMinimumJobForm(page, { title, companyName, field }) {
  await page.getByPlaceholder("วิศวกรซอฟต์แวร์ฝึกงาน").fill(title);
  await page.getByPlaceholder("บริษัท โตโยต้า มอเตอร์ ประเทศไทย จำกัด").fill(companyName);
  // select field (ไม่ใช้ fill — ใช้ selectOption แทน)
  await page.locator("select").filter({ hasText: "-- เลือกสาขา --" }).selectOption(field);
}

/**
 * ค้นหา job ใน list ด้วย ASCII search term → return row
 */
async function searchAndGetJobRow(page, title) {
  const searchInput = page.getByPlaceholder(
    "ตำแหน่ง บริษัท สาขา ที่ตั้ง (Enter เพื่อค้นหา)"
  );
  await searchInput.fill(title);    // ASCII → fill() ทำงานได้

  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row.first()).toBeVisible({ timeout: 10_000 });
  return row.first();
}

// ── tests ─────────────────────────────────────────────────────

test("หน้า Job List โหลดและแสดงปุ่ม 'เพิ่มตำแหน่งงาน'", async ({ page }) => {
  await page.goto(LIST_URL);
  // Link text = "เพิ่มตำแหน่งงาน" (ไม่มี + prefix — icon เป็น SVG)
  await expect(
    page.getByRole("link", { name: /เพิ่มตำแหน่งงาน/ })
  ).toBeVisible({ timeout: 8_000 });
});

test("หน้า /new โหลดได้และแสดงฟอร์ม", async ({ page }) => {
  await page.goto(NEW_URL);
  await expect(page.getByPlaceholder("วิศวกรซอฟต์แวร์ฝึกงาน")).toBeVisible();
  await expect(page.getByRole("button", { name: "บันทึกข้อมูล" })).toBeVisible();
});

test("สร้าง Job ใหม่สำเร็จ → แสดง success state", async ({ page }) => {
  const jobData = makeJobData();
  await page.goto(NEW_URL);
  await fillMinimumJobForm(page, jobData);

  // รอ POST /api/jobs + คลิก submit
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/jobs") && r.request().method() === "POST",
      { timeout: 15_000 }
    ),
    page.getByRole("button", { name: "บันทึกข้อมูล" }).click(),
  ]);
  expect(response.status()).toBe(201);

  // success state (URL ยังอยู่ /new แต่ content เปลี่ยน)
  await expect(page.getByText("เพิ่มตำแหน่งงานสำเร็จ!")).toBeVisible({ timeout: 5_000 });
});

test("Job ที่สร้างใหม่ค้นหาเจอในรายการ", async ({ page }) => {
  const jobData = makeJobData();
  await page.goto(NEW_URL);
  await fillMinimumJobForm(page, jobData);

  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/jobs") && r.request().method() === "POST",
      { timeout: 15_000 }
    ),
    page.getByRole("button", { name: "บันทึกข้อมูล" }).click(),
  ]);
  expect(response.status()).toBe(201);

  // navigate ไป list แล้ว search
  await page.goto(LIST_URL);
  await searchAndGetJobRow(page, jobData.title);
});

test("ลบ Job ผ่าน list → ConfirmDeleteModal → ลบข้อมูล", async ({ page }) => {
  const jobData = makeJobData();

  // สร้าง job
  await page.goto(NEW_URL);
  await fillMinimumJobForm(page, jobData);
  const [postResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/jobs") && r.request().method() === "POST",
      { timeout: 15_000 }
    ),
    page.getByRole("button", { name: "บันทึกข้อมูล" }).click(),
  ]);
  expect(postResp.status()).toBe(201);

  // ไปที่ list + ค้นหา
  await page.goto(LIST_URL);
  const row = await searchAndGetJobRow(page, jobData.title);
  await row.getByTitle("ลบ").click();

  // ConfirmDeleteModal
  await expect(page.getByText("ยืนยันการลบตำแหน่งงาน")).toBeVisible({ timeout: 5_000 });

  // รอ DELETE + confirm
  const [delResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/jobs/") && r.request().method() === "DELETE",
      { timeout: 10_000 }
    ),
    page.getByRole("button", { name: "ลบข้อมูล" }).click(),
  ]);
  expect(delResp.ok()).toBeTruthy();

  // modal ปิดและ row หาย
  await expect(page.getByText("ยืนยันการลบตำแหน่งงาน")).not.toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole("row").filter({ hasText: jobData.title })).not.toBeVisible({ timeout: 5_000 });
});

test("Job detail page — ดูข้อมูลได้หลังสร้าง", async ({ page }) => {
  const jobData = makeJobData();

  // สร้าง job
  await page.goto(NEW_URL);
  await fillMinimumJobForm(page, jobData);
  const [resp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/jobs") && r.request().method() === "POST",
      { timeout: 15_000 }
    ),
    page.getByRole("button", { name: "บันทึกข้อมูล" }).click(),
  ]);
  expect(resp.status()).toBe(201);
  // ดึง id จาก API response
  const created = await resp.json();
  const detailUrl = `/admin/marketplace/job-positions/${created.id}`;

  // navigate ตรงไปที่ detail page (ไม่ผ่าน context — fresh load)
  await page.goto(detailUrl);
  await page.waitForLoadState("networkidle");

  // ตรวจว่า title ปรากฏในหน้า detail (เลือก first เพื่อหลีกเลี่ยง strict mode กรณี title ซ้ำ)
  await expect(page.getByText(jobData.title).first()).toBeVisible({ timeout: 8_000 });
});

test("แก้ไขตำแหน่งงาน — เปลี่ยน title → API ยืนยัน", async ({ page }) => {
  const jobData = makeJobData();

  // สร้าง job + ดึง id
  await page.goto(NEW_URL);
  await fillMinimumJobForm(page, jobData);
  const [postResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/jobs") && r.request().method() === "POST",
      { timeout: 15_000 },
    ),
    page.getByRole("button", { name: "บันทึกข้อมูล" }).click(),
  ]);
  expect(postResp.status()).toBe(201);
  const created = await postResp.json();

  // navigate ตรงไปที่ detail?edit=1
  await page.goto(`/admin/marketplace/job-positions/${created.id}?edit=1`);
  await page.waitForLoadState("networkidle");

  // เปลี่ยน title (ASCII)
  const updatedTitle = `${jobData.title}-EDIT`;
  await page.getByPlaceholder("วิศวกรซอฟต์แวร์ฝึกงาน").fill(updatedTitle);

  // รอ PUT + คลิก "บันทึก"
  // updateJob() ไม่ await ใน handleSave → ใช้ waitForResponse
  const [putResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/jobs/") && r.request().method() === "PUT",
      { timeout: 15_000 },
    ),
    page.getByRole("button", { name: "บันทึก" }).click(),
  ]);
  expect(putResp.ok()).toBeTruthy();

  // กลับ read-only — ปุ่ม "แก้ไข" ปรากฏ
  await expect(page.getByRole("button", { name: "แก้ไข" })).toBeVisible({ timeout: 5_000 });

  // ตรวจ response body
  const body = await putResp.json();
  expect(body.title).toBe(updatedTitle);
});
