/**
 * 26-application-detail.spec.js — ทดสอบ Application (Mapping) detail page
 * ─────────────────────────────────────────────────────────────
 * ปุ่มหลัก: "แก้ไข" → edit, "บันทึก" → PUT /api/mappings/:id, "ยกเลิก" → cancel
 * ต้องการ student + job ที่มีอยู่จริง
 */

import { test, expect } from "../fixtures/base.fixture.js";

let studentId = "", jobId = "", mappingId = "";

test.beforeAll(async ({ apiRequest }) => {
  const ts = Date.now().toString().slice(-8);
  jobId = `JOB-AP-${ts}`;

  const stuRes = await apiRequest.post("/api/students", {
    data: { name: "AppDet", lastname: `Test${ts}`, status: "กำลังศึกษา" },
  });
  expect(stuRes.status()).toBe(201);
  studentId = (await stuRes.json()).id;

  const jobRes = await apiRequest.post("/api/jobs", {
    data: { id: jobId, title: `App Detail Job ${ts}`, type: "ฝึกงาน", field: "วิศวกรรมคอมพิวเตอร์", status: "เปิดรับสมัคร" },
  });
  expect(jobRes.status()).toBe(201);

  const mapRes = await apiRequest.post("/api/mappings", {
    data: { studentId, jobId, status: "สมัครแล้ว" },
  });
  expect(mapRes.status()).toBe(201);
  mappingId = (await mapRes.json()).id;
});

test.afterAll(async ({ apiRequest }) => {
  await apiRequest.delete(`/api/mappings/${mappingId}`).catch(() => {});
  await apiRequest.delete(`/api/students/${studentId}`).catch(() => {});
  await apiRequest.delete(`/api/jobs/${jobId}`).catch(() => {});
});

test("Application detail — navigate ไปยัง /admin/marketplace/applications/:id → โหลดได้", async ({ page }) => {
  await page.goto(`/admin/marketplace/applications/${mappingId}`);
  // รอให้ "แก้ไข" ปรากฏ (page ready + mapping found)
  await expect(page.getByRole("button", { name: "แก้ไข" }).first()).toBeVisible({ timeout: 15_000 });
});

test("Application detail — แสดงข้อมูล student + job", async ({ page }) => {
  await page.goto(`/admin/marketplace/applications/${mappingId}`);
  // student name ปรากฏ 2 ครั้ง (hero + card) — ใช้ first()
  await expect(page.getByText(/AppDet/).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/App Detail Job/).first()).toBeVisible();
});

test("Application detail — กด แก้ไข → เข้า edit mode", async ({ page }) => {
  await page.goto(`/admin/marketplace/applications/${mappingId}`);
  // ปุ่ม แก้ไข แรก (mapping status section)
  const editBtn = page.getByRole("button", { name: "แก้ไข" }).first();
  await expect(editBtn).toBeVisible({ timeout: 10_000 });
  await editBtn.click();
  await expect(page.getByRole("button", { name: "บันทึก" })).toBeVisible();
});

test("Application detail — เปลี่ยน status แล้ว บันทึก → PUT :id → 200", async ({ page }) => {
  await page.goto(`/admin/marketplace/applications/${mappingId}`);
  // เข้า edit mode
  await page.getByRole("button", { name: "แก้ไข" }).first().click();

  // status ใช้ปุ่ม 3 ตัว (grid) ไม่ใช่ <select>
  const statusBtn = page.getByRole("button", { name: "ผ่านการคัดเลือก", exact: true });
  await expect(statusBtn).toBeVisible({ timeout: 5_000 });
  await statusBtn.click();

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes(`/api/mappings/${mappingId}`) && r.request().method() === "PUT"),
    page.getByRole("button", { name: "บันทึก" }).click(),
  ]);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ผ่านการคัดเลือก");
});

test("Application detail — กด ยกเลิก → ออกจาก edit mode", async ({ page }) => {
  await page.goto(`/admin/marketplace/applications/${mappingId}`);
  await page.getByRole("button", { name: "แก้ไข" }).first().click();
  await page.getByRole("button", { name: "ยกเลิก" }).first().click();
  await expect(page.getByRole("button", { name: "แก้ไข" }).first()).toBeVisible();
});
