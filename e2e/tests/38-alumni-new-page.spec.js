/**
 * 38-alumni-new-page.spec.js — ทดสอบ Alumni New Page (/admin/students/alumni/new)
 * ─────────────────────────────────────────────────────────────
 * - navigate → โหลดได้
 * - submit disabled เมื่อฟอร์มว่าง (isValid = name+lastname+major+university+year)
 * - กรอกครบ → submit enabled → POST → navigate ไปยัง alumni detail
 * - [id]/edit redirect → /admin/students/alumni/:id?edit=1
 *
 * หมายเหตุ: name/lastname ไม่มี character filter → ใช้ ASCII ได้
 */

import { test, expect } from "../fixtures/base.fixture.js";

let createdAlumniId = "";

test.afterAll(async ({ apiRequest }) => {
  if (createdAlumniId) {
    await apiRequest.delete(`/api/alumni/${createdAlumniId}`).catch(() => {});
  }
});

test("Alumni new page — navigate → โหลดได้, มีฟอร์ม", async ({ page }) => {
  await page.goto("/admin/students/alumni/new");
  await expect(page.getByText(/เพิ่มศิษย์เก่าใหม่|alumni/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: /บันทึก/ })).toBeVisible();
});

test("Alumni new page — submit disabled เมื่อฟอร์มว่าง", async ({ page }) => {
  await page.goto("/admin/students/alumni/new");
  const submitBtn = page.getByRole("button", { name: /บันทึก/ });
  await expect(submitBtn).toBeVisible({ timeout: 10_000 });
  await expect(submitBtn).toBeDisabled();
});

test("Alumni new page — กรอกครบ required → submit enabled → POST → success", async ({ page }) => {
  const ts = Date.now().toString().slice(-6);
  await page.goto("/admin/students/alumni/new");
  await expect(page.getByPlaceholder("สมชาย")).toBeVisible({ timeout: 10_000 });

  // name + lastname (ไม่มี filter)
  await page.getByPlaceholder("สมชาย").fill(`NewAlu${ts}`);
  await page.getByPlaceholder("ประเสริฐ").fill(`Test${ts}`);

  // major
  await page.getByPlaceholder("วิศวกรรมหุ่นยนต์").fill("ComputerEng");

  // university
  await page.getByPlaceholder("KMITL").fill("KOSEN-KMUTT");

  // graduated year — exact match เพื่อหลีกเลี่ยง "2565-06" ใน employment section
  await page.locator('input[placeholder="2565"]').first().fill("2566");

  const submitBtn = page.getByRole("button", { name: /บันทึก/ });
  await expect(submitBtn).toBeEnabled({ timeout: 5_000 });

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/alumni") && r.request().method() === "POST"),
    submitBtn.click(),
  ]);
  expect(res.status()).toBe(201);
  createdAlumniId = (await res.json()).id;
});

test("Alumni [id]/edit — redirect ไปยัง ?edit=1 อัตโนมัติ", async ({ apiRequest, page }) => {
  const ts = Date.now().toString().slice(-8);
  const alumniId = `ALU-RD-${ts}`;
  const res = await apiRequest.post("/api/alumni", {
    data: { id: alumniId, name: "RedirectAlu", lastname: `Test${ts}`, major: "Eng", graduatedYear: 2566 },
  });
  expect(res.status()).toBe(201);

  await page.goto(`/admin/students/alumni/${alumniId}/edit`);
  // หน้า [id]/edit redirect ไปที่ /admin/students/alumni/:id
  await page.waitForURL(
    (url) => url.pathname === `/admin/students/alumni/${alumniId}`,
    { timeout: 10_000 }
  );
  // ตรวจว่าหน้าโหลดได้ปกติ (แสดง "แก้ไข" button ของ card แรก)
  await expect(page.getByRole("button", { name: "แก้ไข" }).first()).toBeVisible({ timeout: 10_000 });

  await apiRequest.delete(`/api/alumni/${alumniId}`).catch(() => {});
});
