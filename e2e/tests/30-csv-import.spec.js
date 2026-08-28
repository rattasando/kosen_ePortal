/**
 * 30-csv-import.spec.js — ทดสอบ CSV import (FAQ + Companies)
 * ─────────────────────────────────────────────────────────────
 * ใช้ page.setInputFiles() เพื่อ upload CSV file
 * FAQ import modal: upload → confirm (merge mode ค่าเริ่มต้น)
 * Company import: upload → confirm (merge mode)
 *
 * หมายเหตุ: import ใช้ context methods (add/update) — fire-and-forget
 * → ใช้ waitForResponse PUT/POST ดักไม่ได้โดยตรง
 * → ตรวจจากข้อความ "นำเข้าสำเร็จ" หรือ banner ที่ปรากฏหลัง import
 */

import { test, expect } from "../fixtures/base.fixture.js";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

// Helper: สร้าง temp CSV file แล้ว return path
function makeTempCsv(content, filename) {
  const dir = os.tmpdir();
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

test("CSV Import — FAQ: upload CSV → merge mode → นำเข้าสำเร็จ", async ({ page }) => {
  const ts = Date.now().toString().slice(-6);
  const csvContent = `question,answer,category,status\r\n"Import Test FAQ ${ts}","Answer import test","ทั่วไป","published"\r\n`;
  const csvPath = makeTempCsv(csvContent, `faq_import_test_${ts}.csv`);

  await page.goto("/admin/information/faq");
  await expect(page.getByRole("button", { name: "นำเข้า CSV" })).toBeVisible({ timeout: 10_000 });

  // เปิด import modal
  await page.getByRole("button", { name: "นำเข้า CSV" }).click();
  await expect(page.getByText("นำเข้าข้อมูล FAQ")).toBeVisible();

  // upload file ผ่าน hidden input
  const fileInput = page.locator('input[type="file"][accept=".csv"]');
  await fileInput.setInputFiles(csvPath);

  // รอ parse แล้วกด confirm
  // ใช้ regex เฉพาะเจาะจงเพื่อหลีกเลี่ยง mode-selector buttons ("รวมข้อมูล" / "แทนที่ทั้งหมด")
  const confirmBtn = page.getByRole("button", { name: /รวม \d+ รายการ|แทนที่ด้วย \d+/ });
  await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
  await confirmBtn.click();

  // ตรวจข้อความ success
  await expect(page.getByText(/นำเข้าสำเร็จ|รวมข้อมูลสำเร็จ/)).toBeVisible({ timeout: 10_000 });

  // cleanup temp file
  fs.unlinkSync(csvPath);

  // cleanup FAQ ที่ import มา (ค้นหาแล้วลบ)
  await page.getByPlaceholder(/ค้นหา/).fill(`Import Test FAQ ${ts}`);
  await page.waitForTimeout(400);
  // ลบผ่าน API
});

test("CSV Import — FAQ: ไฟล์ไม่ใช่ .csv → แสดง error", async ({ page }) => {
  const tmpPath = makeTempCsv("not a csv", "test.txt");
  // rename เพื่อทดสอบ non-csv
  const nonCsvPath = tmpPath.replace(".txt", "_notcsv.txt");
  fs.renameSync(tmpPath, nonCsvPath);

  await page.goto("/admin/information/faq");
  await page.getByRole("button", { name: "นำเข้า CSV" }).click();
  await expect(page.getByText("นำเข้าข้อมูล FAQ")).toBeVisible();

  const fileInput = page.locator('input[type="file"][accept=".csv"]');
  await fileInput.setInputFiles(nonCsvPath);

  // error message should appear — exact text from FaqListClient handleFile()
  await expect(page.getByText("กรุณาเลือกไฟล์ .csv เท่านั้น")).toBeVisible({ timeout: 5_000 });

  fs.unlinkSync(nonCsvPath);
});

test("CSV Import — Companies: upload CSV → merge mode → นำเข้าสำเร็จ", async ({ page }) => {
  const ts = Date.now().toString().slice(-6);
  const companyId = `COM-IM-${ts}`;
  const csvContent = `id,name,status\r\n"${companyId}","Import Co ${ts}","active"\r\n`;
  const csvPath = makeTempCsv(csvContent, `companies_import_test_${ts}.csv`);

  await page.goto("/admin/companies/list");
  await expect(page.getByRole("button", { name: "นำเข้า CSV" })).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "นำเข้า CSV" }).click();

  // modal or inline import section
  const fileInput = page.locator('input[type="file"][accept=".csv"]');
  await fileInput.setInputFiles(csvPath);

  // Company import modal confirm button text: "นำเข้า N บริษัท"
  // scope to modal to avoid toolbar button being intercepted by modal overlay
  const modal = page.locator(".fixed.inset-0.z-50").last();
  const confirmBtn = modal.getByRole("button", { name: /นำเข้า \d+ บริษัท/ });
  await expect(confirmBtn).toBeVisible({ timeout: 5_000 });

  const [postRes] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/companies") && r.request().method() === "POST").catch(() => null),
    confirmBtn.click(),
  ]);

  await expect(page.getByText(/นำเข้าสำเร็จ|สำเร็จ/)).toBeVisible({ timeout: 10_000 });

  fs.unlinkSync(csvPath);

  // cleanup via API
  const apiPage = page;
  await apiPage.evaluate(async (id) => {
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
  }, companyId);
});

test("CSV Import — Jobs: upload CSV → นำเข้าสำเร็จ", async ({ page }) => {
  const ts = Date.now().toString().slice(-6);
  const jobId = `JOB-IM-${ts}`;
  const csvContent = `id,title,type,field,status\r\n"${jobId}","Import Job ${ts}","ฝึกงาน","วิศวกรรมคอมพิวเตอร์","เปิดรับสมัคร"\r\n`;
  const csvPath = makeTempCsv(csvContent, `jobs_import_test_${ts}.csv`);

  await page.goto("/admin/marketplace/job-positions");
  await expect(page.getByRole("button", { name: "นำเข้า CSV" })).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "นำเข้า CSV" }).click();

  const fileInput = page.locator('input[type="file"][accept=".csv"]');
  await fileInput.setInputFiles(csvPath);

  // scope ไปยัง modal เพื่อหลีกเลี่ยง toolbar button ที่ถูกซ้อนทับ
  const modal = page.locator(".fixed.inset-0.z-50").last();
  const confirmBtn = modal.getByRole("button", { name: /รวม \d+ รายการ|แทนที่ด้วย \d+/ });
  await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
  await confirmBtn.click();

  await expect(page.getByText(/นำเข้าสำเร็จ|สำเร็จ/)).toBeVisible({ timeout: 10_000 });

  fs.unlinkSync(csvPath);

  // cleanup
  await page.evaluate(async (id) => {
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
  }, jobId);
});
