/**
 * 25-job-detail.spec.js — ทดสอบ Job Position detail page
 * ─────────────────────────────────────────────────────────────
 * ปุ่ม: "แก้ไข" → edit, "บันทึก" → PUT /api/jobs/:id, "ยกเลิก" → cancel
 * URL ?edit=1 → เปิด edit mode อัตโนมัติ
 */

import { test, expect } from "../fixtures/base.fixture.js";

let jobId = "";

test.beforeAll(async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  jobId = `JOB-DT-${ts}`;
  const res = await apiRequest.post("/api/jobs", {
    data: {
      id:          jobId,
      title:       `Detail Job ${ts}`,
      companyName: `Co Detail ${ts}`,
      type:        "ฝึกงาน",
      field:       "วิศวกรรมคอมพิวเตอร์",
      status:      "เปิดรับสมัคร",
    },
  });
  expect(res.status()).toBe(201);
});

test.afterAll(async ({ apiRequest }) => {
  await apiRequest.delete(`/api/jobs/${jobId}`).catch(() => {});
});

test("Job detail — navigate ไปยัง /admin/marketplace/job-positions/:id → โหลดได้", async ({ page }) => {
  await page.goto(`/admin/marketplace/job-positions/${jobId}`);
  await expect(page.getByText(/Detail Job/).first()).toBeVisible({ timeout: 10_000 });
});

test("Job detail — กด แก้ไข → เข้า edit mode", async ({ page }) => {
  await page.goto(`/admin/marketplace/job-positions/${jobId}`);
  const editBtn = page.getByRole("button", { name: "แก้ไข" });
  await expect(editBtn).toBeVisible({ timeout: 10_000 });
  await editBtn.click();
  await expect(page.getByRole("button", { name: "บันทึก" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ยกเลิก" })).toBeVisible();
});

test("Job detail — กด ยกเลิก → ออกจาก edit mode", async ({ page }) => {
  await page.goto(`/admin/marketplace/job-positions/${jobId}`);
  await page.getByRole("button", { name: "แก้ไข" }).click();
  await page.getByRole("button", { name: "ยกเลิก" }).click();
  await expect(page.getByRole("button", { name: "แก้ไข" })).toBeVisible();
});

test("Job detail — แก้ไข title แล้ว บันทึก → PUT :id → 200", async ({ page }) => {
  await page.goto(`/admin/marketplace/job-positions/${jobId}?edit=1`);

  // รอ edit mode โหลด
  const titleInput = page.locator("input").filter({ hasText: "" }).first();
  // ใช้ input ที่ label = "ชื่อตำแหน่งงาน" หรือ placeholder เกี่ยวกับ title
  const titleField = page.locator("input[type='text']").first();
  await expect(titleField).toBeVisible({ timeout: 10_000 });
  await titleField.fill(`Detail Job ${jobId.split("-").pop()} Updated`);

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/api/jobs/${jobId}`) && r.request().method() === "PUT"),
    page.getByRole("button", { name: "บันทึก" }).click(),
  ]);
  expect(res.status()).toBe(200);
  await expect(page.getByRole("button", { name: "แก้ไข" })).toBeVisible();
});

test("Job detail — URL ?edit=1 → เปิด edit mode อัตโนมัติ", async ({ page }) => {
  await page.goto(`/admin/marketplace/job-positions/${jobId}?edit=1`);
  await expect(page.getByRole("button", { name: "บันทึก" })).toBeVisible({ timeout: 10_000 });
});
